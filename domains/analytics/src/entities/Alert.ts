import { Threshold } from '../value-objects/Threshold';
import { DimensionCollection } from '../value-objects/Dimension';
import { MetricValue } from '../value-objects/MetricValue';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';
import { DomainEvent } from '../../../shared-kernel/src/events/DomainEvent';

export class AlertId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('AlertId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: AlertId): boolean {
    return this.value === other.value;
  }

  static generate(): AlertId {
    return new AlertId(`alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  static fromString(value: string): AlertId {
    return new AlertId(value);
  }
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
  DISABLED = 'disabled'
}

export enum AlertChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app',
  SMS = 'sms'
}

export interface AlertConfiguration {
  channels: AlertChannel[];
  cooldownMinutes: number;
  maxTriggersPerHour: number;
  autoResolve: boolean;
  autoResolveAfterMinutes?: number;
}

export class AlertTriggeredEvent extends DomainEvent {
  constructor(
    alertId: string,
    public readonly alertName: string,
    public readonly metricName: string,
    public readonly currentValue: number,
    public readonly thresholdDescription: string,
    public readonly severity: string
  ) {
    super(alertId, 'AlertTriggered');
  }

  getPayload() {
    return {
      alertName: this.alertName,
      metricName: this.metricName,
      currentValue: this.currentValue,
      thresholdDescription: this.thresholdDescription,
      severity: this.severity
    };
  }
}

export class AlertResolvedEvent extends DomainEvent {
  constructor(
    alertId: string,
    public readonly alertName: string,
    public readonly resolvedAt: Date,
    public readonly autoResolved: boolean
  ) {
    super(alertId, 'AlertResolved');
  }

  getPayload() {
    return {
      alertName: this.alertName,
      resolvedAt: this.resolvedAt.toISOString(),
      autoResolved: this.autoResolved
    };
  }
}

export class Alert {
  private domainEvents: DomainEvent[] = [];
  private lastTriggered?: Date;
  private triggerCount: number = 0;
  private triggersThisHour: number = 0;
  private lastHourReset: Date = new Date();

  private constructor(
    private readonly id: AlertId,
    private readonly name: string,
    private readonly metricName: string,
    private readonly threshold: Threshold,
    private readonly dimensions: DimensionCollection,
    private readonly configuration: AlertConfiguration,
    private status: AlertStatus = AlertStatus.ACTIVE,
    private readonly description?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Alert name cannot be empty');
    }
    if (!metricName || metricName.trim().length === 0) {
      throw new DomainException('Metric name cannot be empty');
    }
    if (configuration.cooldownMinutes < 0) {
      throw new DomainException('Cooldown minutes cannot be negative');
    }
    if (configuration.maxTriggersPerHour < 1) {
      throw new DomainException('Max triggers per hour must be at least 1');
    }
  }

  static create(
    name: string,
    metricName: string,
    threshold: Threshold,
    dimensions: DimensionCollection,
    configuration: AlertConfiguration,
    options: {
      id?: AlertId;
      description?: string;
    } = {}
  ): Alert {
    return new Alert(
      options.id || AlertId.generate(),
      name,
      metricName,
      threshold,
      dimensions,
      configuration,
      AlertStatus.ACTIVE,
      options.description
    );
  }

  // Factory methods for common alerts
  static highCpuUsage(threshold: number = 80): Alert {
    const dimensions = new DimensionCollection();
    const config: AlertConfiguration = {
      channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
      cooldownMinutes: 15,
      maxTriggersPerHour: 4,
      autoResolve: true,
      autoResolveAfterMinutes: 30
    };

    return Alert.create(
      'High CPU Usage',
      'cpu_usage',
      Threshold.greaterThan(threshold, 'critical' as any),
      dimensions,
      config,
      {
        description: `CPU usage exceeds ${threshold}%`
      }
    );
  }

  static workflowFailureRate(threshold: number = 5): Alert {
    const dimensions = new DimensionCollection();
    const config: AlertConfiguration = {
      channels: [AlertChannel.EMAIL, AlertChannel.IN_APP],
      cooldownMinutes: 10,
      maxTriggersPerHour: 6,
      autoResolve: false
    };

    return Alert.create(
      'High Workflow Failure Rate',
      'workflow_failure_rate',
      Threshold.greaterThan(threshold, 'warning' as any),
      dimensions,
      config,
      {
        description: `Workflow failure rate exceeds ${threshold}%`
      }
    );
  }

  static apiResponseTime(threshold: number = 2000): Alert {
    const dimensions = new DimensionCollection();
    const config: AlertConfiguration = {
      channels: [AlertChannel.SLACK, AlertChannel.WEBHOOK],
      cooldownMinutes: 5,
      maxTriggersPerHour: 12,
      autoResolve: true,
      autoResolveAfterMinutes: 15
    };

    return Alert.create(
      'Slow API Response Time',
      'api_response_time',
      Threshold.greaterThan(threshold, 'warning' as any),
      dimensions,
      config,
      {
        description: `API response time exceeds ${threshold}ms`
      }
    );
  }

  evaluate(metricValue: MetricValue): boolean {
    if (this.status !== AlertStatus.ACTIVE) {
      return false;
    }

    // Check if we're in cooldown period
    if (this.isInCooldown()) {
      return false;
    }

    // Check hourly trigger limits
    if (this.hasExceededHourlyTriggerLimit()) {
      return false;
    }

    // Evaluate threshold
    const isTriggered = this.threshold.evaluate(metricValue.value);
    
    if (isTriggered) {
      this.trigger(metricValue);
      return true;
    } else if (this.status === AlertStatus.TRIGGERED && this.configuration.autoResolve) {
      this.resolve(true);
    }

    return false;
  }

  private trigger(metricValue: MetricValue): void {
    this.status = AlertStatus.TRIGGERED;
    this.lastTriggered = new Date();
    this.triggerCount++;
    this.incrementHourlyTriggerCount();
    this.updatedAt = new Date();

    const event = new AlertTriggeredEvent(
      this.id.toString(),
      this.name,
      this.metricName,
      metricValue.value,
      this.threshold.getDescription(),
      this.threshold.severity
    );

    this.domainEvents.push(event);
  }

  resolve(autoResolved: boolean = false): void {
    if (this.status === AlertStatus.TRIGGERED) {
      this.status = AlertStatus.RESOLVED;
      this.updatedAt = new Date();

      const event = new AlertResolvedEvent(
        this.id.toString(),
        this.name,
        new Date(),
        autoResolved
      );

      this.domainEvents.push(event);
    }
  }

  suppress(): void {
    this.status = AlertStatus.SUPPRESSED;
    this.updatedAt = new Date();
  }

  enable(): void {
    if (this.status === AlertStatus.DISABLED) {
      this.status = AlertStatus.ACTIVE;
      this.updatedAt = new Date();
    }
  }

  disable(): void {
    this.status = AlertStatus.DISABLED;
    this.updatedAt = new Date();
  }

  private isInCooldown(): boolean {
    if (!this.lastTriggered) return false;
    
    const cooldownMs = this.configuration.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - this.lastTriggered.getTime();
    
    return timeSinceLastTrigger < cooldownMs;
  }

  private hasExceededHourlyTriggerLimit(): boolean {
    this.resetHourlyCountIfNeeded();
    return this.triggersThisHour >= this.configuration.maxTriggersPerHour;
  }

  private incrementHourlyTriggerCount(): void {
    this.resetHourlyCountIfNeeded();
    this.triggersThisHour++;
  }

  private resetHourlyCountIfNeeded(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (this.lastHourReset.getTime() < oneHourAgo) {
      this.triggersThisHour = 0;
      this.lastHourReset = new Date();
    }
  }

  // Getters
  getId(): AlertId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getMetricName(): string {
    return this.metricName;
  }

  getThreshold(): Threshold {
    return this.threshold;
  }

  getDimensions(): DimensionCollection {
    return this.dimensions;
  }

  getConfiguration(): AlertConfiguration {
    return { ...this.configuration };
  }

  getStatus(): AlertStatus {
    return this.status;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getLastTriggered(): Date | undefined {
    return this.lastTriggered;
  }

  getTriggerCount(): number {
    return this.triggerCount;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  markEventsAsCommitted(): void {
    this.domainEvents = [];
  }

  equals(other: Alert): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `${this.name} [${this.status}]: ${this.threshold.toString()}`;
  }
}