import { MetricValue } from '../value-objects/MetricValue';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';
import { DomainEvent } from '../../../shared-kernel/src/events/DomainEvent';

export class ComponentId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('ComponentId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ComponentId): boolean {
    return this.value === other.value;
  }

  static fromString(value: string): ComponentId {
    return new ComponentId(value);
  }
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  DOWN = 'down',
  UNKNOWN = 'unknown'
}

export enum ComponentType {
  DATABASE = 'database',
  API_GATEWAY = 'api_gateway',
  WORKFLOW_ENGINE = 'workflow_engine',
  AUTH_SERVICE = 'auth_service',
  NOTIFICATION_SERVICE = 'notification_service',
  ANALYTICS_SERVICE = 'analytics_service',
  INTEGRATION_SERVICE = 'integration_service',
  EXTERNAL_API = 'external_api',
  LOAD_BALANCER = 'load_balancer',
  CACHE = 'cache'
}

export interface SystemMetrics {
  cpuUsage: MetricValue;
  memoryUsage: MetricValue;
  diskUsage: MetricValue;
  networkIn: MetricValue;
  networkOut: MetricValue;
  responseTime: MetricValue;
  errorRate: MetricValue;
  throughput: MetricValue;
}

export class SystemHealthCheckEvent extends DomainEvent {
  constructor(
    componentId: string,
    public readonly componentName: string,
    public readonly status: HealthStatus,
    public readonly previousStatus: HealthStatus,
    public readonly metrics: SystemMetrics
  ) {
    super(componentId, 'SystemHealthCheck');
  }

  getPayload() {
    return {
      componentName: this.componentName,
      status: this.status,
      previousStatus: this.previousStatus,
      metrics: {
        cpuUsage: this.metrics.cpuUsage.value,
        memoryUsage: this.metrics.memoryUsage.value,
        diskUsage: this.metrics.diskUsage.value,
        responseTime: this.metrics.responseTime.value,
        errorRate: this.metrics.errorRate.value
      }
    };
  }
}

export class SystemAlertEvent extends DomainEvent {
  constructor(
    componentId: string,
    public readonly componentName: string,
    public readonly alertType: string,
    public readonly severity: string,
    public readonly message: string,
    public readonly metrics: SystemMetrics
  ) {
    super(componentId, 'SystemAlert');
  }

  getPayload() {
    return {
      componentName: this.componentName,
      alertType: this.alertType,
      severity: this.severity,
      message: this.message,
      metrics: {
        cpuUsage: this.metrics.cpuUsage.value,
        memoryUsage: this.metrics.memoryUsage.value,
        errorRate: this.metrics.errorRate.value
      }
    };
  }
}

export class SystemHealth {
  private domainEvents: DomainEvent[] = [];
  private previousStatus: HealthStatus = HealthStatus.UNKNOWN;

  private constructor(
    private readonly componentId: ComponentId,
    private readonly name: string,
    private readonly type: ComponentType,
    private status: HealthStatus,
    private metrics: SystemMetrics,
    private readonly version?: string,
    private readonly description?: string,
    private lastChecked: Date = new Date(),
    private readonly createdAt: Date = new Date()
  ) {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Component name cannot be empty');
    }
  }

  static create(
    componentId: ComponentId,
    name: string,
    type: ComponentType,
    initialMetrics: SystemMetrics,
    options: {
      version?: string;
      description?: string;
    } = {}
  ): SystemHealth {
    const health = new SystemHealth(
      componentId,
      name,
      type,
      HealthStatus.UNKNOWN,
      initialMetrics,
      options.version,
      options.description
    );

    // Determine initial status based on metrics
    health.updateHealth(initialMetrics);
    return health;
  }

  // Factory methods for common components
  static database(name: string, metrics: SystemMetrics): SystemHealth {
    return SystemHealth.create(
      ComponentId.fromString(`db-${name.toLowerCase()}`),
      name,
      ComponentType.DATABASE,
      metrics,
      { description: 'Database component health monitoring' }
    );
  }

  static apiGateway(metrics: SystemMetrics): SystemHealth {
    return SystemHealth.create(
      ComponentId.fromString('api-gateway'),
      'API Gateway',
      ComponentType.API_GATEWAY,
      metrics,
      { description: 'API Gateway health and performance monitoring' }
    );
  }

  static workflowEngine(metrics: SystemMetrics): SystemHealth {
    return SystemHealth.create(
      ComponentId.fromString('workflow-engine'),
      'Workflow Engine',
      ComponentType.WORKFLOW_ENGINE,
      metrics,
      { description: 'Workflow execution engine health monitoring' }
    );
  }

  static authService(metrics: SystemMetrics): SystemHealth {
    return SystemHealth.create(
      ComponentId.fromString('auth-service'),
      'Authentication Service',
      ComponentType.AUTH_SERVICE,
      metrics,
      { description: 'Authentication service health monitoring' }
    );
  }

  static externalApi(serviceName: string, metrics: SystemMetrics): SystemHealth {
    return SystemHealth.create(
      ComponentId.fromString(`external-${serviceName.toLowerCase()}`),
      `${serviceName} API`,
      ComponentType.EXTERNAL_API,
      metrics,
      { description: `External ${serviceName} API health monitoring` }
    );
  }

  updateHealth(newMetrics: SystemMetrics): void {
    this.previousStatus = this.status;
    this.metrics = newMetrics;
    this.lastChecked = new Date();

    // Determine new health status based on metrics
    const newStatus = this.calculateHealthStatus(newMetrics);
    
    if (newStatus !== this.status) {
      this.status = newStatus;
      
      // Publish health check event
      const healthEvent = new SystemHealthCheckEvent(
        this.componentId.toString(),
        this.name,
        this.status,
        this.previousStatus,
        this.metrics
      );
      this.domainEvents.push(healthEvent);

      // Publish alert if status is critical or down
      if (this.status === HealthStatus.CRITICAL || this.status === HealthStatus.DOWN) {
        this.publishAlert();
      }
    }
  }

  private calculateHealthStatus(metrics: SystemMetrics): HealthStatus {
    const criticalThresholds = {
      cpuUsage: 90,
      memoryUsage: 90,
      diskUsage: 95,
      errorRate: 10,
      responseTime: 5000 // 5 seconds
    };

    const warningThresholds = {
      cpuUsage: 75,
      memoryUsage: 75,
      diskUsage: 85,
      errorRate: 5,
      responseTime: 2000 // 2 seconds
    };

    // Check for critical conditions
    if (metrics.cpuUsage.value >= criticalThresholds.cpuUsage ||
        metrics.memoryUsage.value >= criticalThresholds.memoryUsage ||
        metrics.diskUsage.value >= criticalThresholds.diskUsage ||
        metrics.errorRate.value >= criticalThresholds.errorRate ||
        metrics.responseTime.value >= criticalThresholds.responseTime) {
      return HealthStatus.CRITICAL;
    }

    // Check for warning conditions
    if (metrics.cpuUsage.value >= warningThresholds.cpuUsage ||
        metrics.memoryUsage.value >= warningThresholds.memoryUsage ||
        metrics.diskUsage.value >= warningThresholds.diskUsage ||
        metrics.errorRate.value >= warningThresholds.errorRate ||
        metrics.responseTime.value >= warningThresholds.responseTime) {
      return HealthStatus.WARNING;
    }

    // Check if component is responding (basic availability check)
    if (metrics.responseTime.value === 0 && metrics.throughput.value === 0) {
      return HealthStatus.DOWN;
    }

    return HealthStatus.HEALTHY;
  }

  private publishAlert(): void {
    let alertType = 'performance';
    let message = 'System performance degraded';

    if (this.status === HealthStatus.DOWN) {
      alertType = 'availability';
      message = 'Component is not responding';
    } else if (this.metrics.cpuUsage.value >= 90) {
      alertType = 'high_cpu';
      message = `High CPU usage: ${this.metrics.cpuUsage.displayValue}`;
    } else if (this.metrics.memoryUsage.value >= 90) {
      alertType = 'high_memory';
      message = `High memory usage: ${this.metrics.memoryUsage.displayValue}`;
    } else if (this.metrics.errorRate.value >= 10) {
      alertType = 'high_error_rate';
      message = `High error rate: ${this.metrics.errorRate.displayValue}`;
    } else if (this.metrics.responseTime.value >= 5000) {
      alertType = 'slow_response';
      message = `Slow response time: ${this.metrics.responseTime.displayValue}`;
    }

    const alertEvent = new SystemAlertEvent(
      this.componentId.toString(),
      this.name,
      alertType,
      this.status === HealthStatus.CRITICAL ? 'critical' : 'warning',
      message,
      this.metrics
    );

    this.domainEvents.push(alertEvent);
  }

  isHealthy(): boolean {
    return this.status === HealthStatus.HEALTHY;
  }

  hasWarnings(): boolean {
    return this.status === HealthStatus.WARNING;
  }

  isCritical(): boolean {
    return this.status === HealthStatus.CRITICAL;
  }

  isDown(): boolean {
    return this.status === HealthStatus.DOWN;
  }

  getUptimePercentage(hoursBack: number = 24): number {
    // This would typically calculate uptime based on historical data
    // For now, return a calculated value based on current status
    switch (this.status) {
      case HealthStatus.HEALTHY:
        return 99.9;
      case HealthStatus.WARNING:
        return 99.5;
      case HealthStatus.CRITICAL:
        return 95.0;
      case HealthStatus.DOWN:
        return 0.0;
      default:
        return 100.0;
    }
  }

  getHealthSummary(): {
    status: HealthStatus;
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Analyze metrics and provide recommendations
    if (this.metrics.cpuUsage.value > 75) {
      issues.push(`High CPU usage: ${this.metrics.cpuUsage.displayValue}`);
      recommendations.push('Consider scaling up or optimizing CPU-intensive operations');
      score -= 20;
    }

    if (this.metrics.memoryUsage.value > 75) {
      issues.push(`High memory usage: ${this.metrics.memoryUsage.displayValue}`);
      recommendations.push('Check for memory leaks or consider increasing memory allocation');
      score -= 20;
    }

    if (this.metrics.errorRate.value > 5) {
      issues.push(`High error rate: ${this.metrics.errorRate.displayValue}`);
      recommendations.push('Investigate error logs and fix underlying issues');
      score -= 30;
    }

    if (this.metrics.responseTime.value > 2000) {
      issues.push(`Slow response time: ${this.metrics.responseTime.displayValue}`);
      recommendations.push('Optimize queries and consider caching strategies');
      score -= 25;
    }

    return {
      status: this.status,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  // Getters
  getComponentId(): ComponentId {
    return this.componentId;
  }

  getName(): string {
    return this.name;
  }

  getType(): ComponentType {
    return this.type;
  }

  getStatus(): HealthStatus {
    return this.status;
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getVersion(): string | undefined {
    return this.version;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getLastChecked(): Date {
    return this.lastChecked;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  markEventsAsCommitted(): void {
    this.domainEvents = [];
  }

  equals(other: SystemHealth): boolean {
    return this.componentId.equals(other.componentId);
  }

  toString(): string {
    return `${this.name} [${this.type}]: ${this.status}`;
  }
}