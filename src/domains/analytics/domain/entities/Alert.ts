/**
 * Analytics Domain - Alert Entity
 * Threshold-based monitoring alerts with trigger conditions
 */

import { Threshold, ThresholdSeverity } from '../value-objects/Threshold';
import { MetricValue } from '../value-objects/MetricValue';

export type AlertStatus = 'active' | 'paused' | 'disabled' | 'triggered';

export type NotificationChannel = 'email' | 'sms' | 'webhook' | 'in_app' | 'slack';

export interface NotificationConfig {
  channels: NotificationChannel[];
  recipients: string[];
  webhookUrl?: string;
  messageTemplate?: string;
  cooldownMinutes?: number;
}

export interface AlertTrigger {
  timestamp: Date;
  metricValue: MetricValue;
  message: string;
  notificationsSent: number;
}

export class Alert {
  private constructor(
    private readonly _id: number,
    private readonly _userId: number,
    private readonly _name: string,
    private readonly _description: string,
    private readonly _metricName: string,
    private readonly _threshold: Threshold,
    private readonly _notificationConfig: NotificationConfig,
    private readonly _status: AlertStatus = 'active',
    private readonly _lastTriggered: Date | null = null,
    private readonly _triggerCount: number = 0,
    private readonly _triggers: AlertTrigger[] = [],
    private readonly _createdAt: Date = new Date(),
    private readonly _updatedAt: Date = new Date()
  ) {
    this.validateAlert();
  }

  static create(
    id: number,
    userId: number,
    name: string,
    description: string,
    metricName: string,
    threshold: Threshold,
    notificationConfig: NotificationConfig
  ): Alert {
    return new Alert(
      id,
      userId,
      name,
      description,
      metricName,
      threshold,
      notificationConfig,
      'active',
      null,
      0,
      [],
      new Date(),
      new Date()
    );
  }

  get id(): number {
    return this._id;
  }

  get userId(): number {
    return this._userId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get metricName(): string {
    return this._metricName;
  }

  get threshold(): Threshold {
    return this._threshold;
  }

  get notificationConfig(): NotificationConfig {
    return { ...this._notificationConfig };
  }

  get status(): AlertStatus {
    return this._status;
  }

  get lastTriggered(): Date | null {
    return this._lastTriggered ? new Date(this._lastTriggered) : null;
  }

  get triggerCount(): number {
    return this._triggerCount;
  }

  get triggers(): AlertTrigger[] {
    return [...this._triggers];
  }

  get recentTriggers(): AlertTrigger[] {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this._triggers.filter(trigger => trigger.timestamp > oneDayAgo);
  }

  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  get isActive(): boolean {
    return this._status === 'active';
  }

  get isPaused(): boolean {
    return this._status === 'paused';
  }

  get isTriggered(): boolean {
    return this._status === 'triggered';
  }

  get severity(): ThresholdSeverity {
    return this._threshold.severity;
  }

  get displayName(): string {
    return `${this._name} (${this._metricName})`;
  }

  shouldTrigger(metricValue: MetricValue): boolean {
    if (!this.isActive) {
      return false;
    }

    if (this.isInCooldown()) {
      return false;
    }

    return this._threshold.evaluate(metricValue.value);
  }

  trigger(metricValue: MetricValue, message?: string): Alert {
    if (!this.shouldTrigger(metricValue)) {
      return this;
    }

    const triggerMessage = message || this.generateTriggerMessage(metricValue);
    const trigger: AlertTrigger = {
      timestamp: new Date(),
      metricValue,
      message: triggerMessage,
      notificationsSent: this._notificationConfig.channels.length
    };

    const newTriggers = [...this._triggers, trigger].slice(-50); // Keep last 50 triggers

    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      this._threshold,
      this._notificationConfig,
      'triggered',
      new Date(),
      this._triggerCount + 1,
      newTriggers,
      this._createdAt,
      new Date()
    );
  }

  acknowledge(): Alert {
    if (!this.isTriggered) {
      return this;
    }

    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      this._threshold,
      this._notificationConfig,
      'active',
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  pause(): Alert {
    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      this._threshold,
      this._notificationConfig,
      'paused',
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  resume(): Alert {
    if (this._status !== 'paused') {
      return this;
    }

    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      this._threshold,
      this._notificationConfig,
      'active',
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  disable(): Alert {
    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      this._threshold,
      this._notificationConfig,
      'disabled',
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  updateThreshold(threshold: Threshold): Alert {
    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      threshold,
      this._notificationConfig,
      this._status,
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  updateNotificationConfig(config: NotificationConfig): Alert {
    return new Alert(
      this._id,
      this._userId,
      this._name,
      this._description,
      this._metricName,
      this._threshold,
      config,
      this._status,
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  updateDetails(name: string, description: string): Alert {
    return new Alert(
      this._id,
      this._userId,
      name,
      description,
      this._metricName,
      this._threshold,
      this._notificationConfig,
      this._status,
      this._lastTriggered,
      this._triggerCount,
      this._triggers,
      this._createdAt,
      new Date()
    );
  }

  isInCooldown(): boolean {
    if (!this._lastTriggered || !this._notificationConfig.cooldownMinutes) {
      return false;
    }

    const cooldownMs = this._notificationConfig.cooldownMinutes * 60 * 1000;
    return Date.now() - this._lastTriggered.getTime() < cooldownMs;
  }

  getCooldownRemainingMs(): number {
    if (!this.isInCooldown()) {
      return 0;
    }

    const cooldownMs = (this._notificationConfig.cooldownMinutes || 0) * 60 * 1000;
    const elapsed = Date.now() - (this._lastTriggered?.getTime() || 0);
    return Math.max(0, cooldownMs - elapsed);
  }

  getFrequency(): number {
    if (this._triggers.length < 2) {
      return 0;
    }

    const timeSpan = this._triggers[this._triggers.length - 1].timestamp.getTime() - 
                    this._triggers[0].timestamp.getTime();
    return this._triggers.length / (timeSpan / (60 * 60 * 1000)); // triggers per hour
  }

  toJSON(): Record<string, any> {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      description: this._description,
      metricName: this._metricName,
      threshold: this._threshold.toJSON(),
      notificationConfig: this._notificationConfig,
      status: this._status,
      lastTriggered: this._lastTriggered?.toISOString() || null,
      triggerCount: this._triggerCount,
      recentTriggers: this.recentTriggers,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      isActive: this.isActive,
      isPaused: this.isPaused,
      isTriggered: this.isTriggered,
      severity: this.severity,
      displayName: this.displayName,
      isInCooldown: this.isInCooldown(),
      cooldownRemainingMs: this.getCooldownRemainingMs(),
      frequency: this.getFrequency()
    };
  }

  private generateTriggerMessage(metricValue: MetricValue): string {
    const template = this._notificationConfig.messageTemplate;
    if (template) {
      return template
        .replace('{{metric_name}}', this._metricName)
        .replace('{{metric_value}}', metricValue.displayValue)
        .replace('{{threshold}}', this._threshold.displayText)
        .replace('{{alert_name}}', this._name)
        .replace('{{severity}}', this._threshold.severity);
    }

    return `Alert "${this._name}" triggered: ${this._metricName} is ${metricValue.displayValue} (threshold: ${this._threshold.displayText})`;
  }

  private validateAlert(): void {
    if (this._id <= 0) {
      throw new Error('Alert ID must be positive');
    }

    if (this._userId <= 0) {
      throw new Error('User ID must be positive');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Alert name cannot be empty');
    }

    if (this._name.length > 200) {
      throw new Error('Alert name cannot exceed 200 characters');
    }

    if (!this._metricName || this._metricName.trim().length === 0) {
      throw new Error('Metric name cannot be empty');
    }

    if (this._notificationConfig.channels.length === 0) {
      throw new Error('At least one notification channel must be specified');
    }

    if (this._notificationConfig.recipients.length === 0) {
      throw new Error('At least one recipient must be specified');
    }

    if (this._triggerCount < 0) {
      throw new Error('Trigger count cannot be negative');
    }

    if (this._lastTriggered && this._lastTriggered > new Date()) {
      throw new Error('Last triggered time cannot be in the future');
    }
  }
}