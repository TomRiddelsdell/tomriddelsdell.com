import { MetricValue } from '../value-objects/MetricValue';
import { DimensionCollection } from '../value-objects/Dimension';
import { DomainException } from '../../../shared-kernel/src/exceptions/DomainException';

export class MetricId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('MetricId cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: MetricId): boolean {
    return this.value === other.value;
  }

  static generate(): MetricId {
    return new MetricId(`metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }

  static fromString(value: string): MetricId {
    return new MetricId(value);
  }
}

export enum MetricCategory {
  PERFORMANCE = 'performance',
  USAGE = 'usage',
  ERROR = 'error',
  BUSINESS = 'business',
  SYSTEM = 'system',
  SECURITY = 'security'
}

export class Metric {
  private constructor(
    private readonly id: MetricId,
    private readonly name: string,
    private readonly value: MetricValue,
    private readonly dimensions: DimensionCollection,
    private readonly category: MetricCategory,
    private readonly source: string,
    private readonly description?: string,
    private readonly tags: string[] = [],
    private readonly timestamp: Date = new Date()
  ) {
    if (!name || name.trim().length === 0) {
      throw new DomainException('Metric name cannot be empty');
    }
    if (!source || source.trim().length === 0) {
      throw new DomainException('Metric source cannot be empty');
    }
  }

  static create(
    name: string,
    value: MetricValue,
    dimensions: DimensionCollection,
    category: MetricCategory,
    source: string,
    options: {
      id?: MetricId;
      description?: string;
      tags?: string[];
      timestamp?: Date;
    } = {}
  ): Metric {
    return new Metric(
      options.id || MetricId.generate(),
      name,
      value,
      dimensions,
      category,
      source,
      options.description,
      options.tags || [],
      options.timestamp || new Date()
    );
  }

  // Factory methods for common metrics
  static workflowExecution(
    workflowId: string,
    userId: string,
    executionTime: number,
    status: 'success' | 'error'
  ): Metric {
    const dimensions = new DimensionCollection()
      .add(DimensionCollection.prototype.constructor.prototype.constructor.call(
        Object.create(DimensionCollection.prototype), []
      ));
    
    // Use proper dimension creation
    const workflowDimension = { type: 'workflow' as any, value: workflowId, displayLabel: `Workflow ${workflowId}` };
    const userDimension = { type: 'user' as any, value: userId, displayLabel: `User ${userId}` };
    const statusDimension = { type: 'status' as any, value: status, displayLabel: status };
    
    return Metric.create(
      'workflow_execution_time',
      MetricValue.timer(executionTime),
      new DimensionCollection([workflowDimension, userDimension, statusDimension] as any),
      MetricCategory.PERFORMANCE,
      'workflow-engine',
      {
        description: 'Time taken to execute workflow',
        tags: ['workflow', 'performance', status]
      }
    );
  }

  static userLogin(userId: string, source: string = 'web'): Metric {
    const userDimension = { type: 'user' as any, value: userId, displayLabel: `User ${userId}` };
    const sourceDimension = { type: 'source' as any, value: source, displayLabel: source };
    
    return Metric.create(
      'user_login',
      MetricValue.counter(1, 'logins'),
      new DimensionCollection([userDimension, sourceDimension] as any),
      MetricCategory.USAGE,
      'auth-service',
      {
        description: 'User login event',
        tags: ['auth', 'user', 'login']
      }
    );
  }

  static apiRequest(endpoint: string, method: string, responseTime: number, statusCode: number): Metric {
    const endpointDimension = { type: 'source' as any, value: endpoint, displayLabel: endpoint };
    const methodDimension = { type: 'category' as any, value: method, displayLabel: method };
    const statusDimension = { type: 'status' as any, value: statusCode.toString(), displayLabel: statusCode.toString() };
    
    return Metric.create(
      'api_response_time',
      MetricValue.timer(responseTime),
      new DimensionCollection([endpointDimension, methodDimension, statusDimension] as any),
      MetricCategory.PERFORMANCE,
      'api-gateway',
      {
        description: 'API endpoint response time',
        tags: ['api', 'performance', method.toLowerCase()]
      }
    );
  }

  static systemHealth(component: string, cpuUsage: number, memoryUsage: number): Metric[] {
    const componentDimension = { type: 'source' as any, value: component, displayLabel: component };
    const dimensions = new DimensionCollection([componentDimension] as any);
    
    return [
      Metric.create(
        'cpu_usage',
        MetricValue.percentage(cpuUsage),
        dimensions,
        MetricCategory.SYSTEM,
        'system-monitor',
        {
          description: 'CPU usage percentage',
          tags: ['system', 'cpu', 'health']
        }
      ),
      Metric.create(
        'memory_usage',
        MetricValue.percentage(memoryUsage),
        dimensions,
        MetricCategory.SYSTEM,
        'system-monitor',
        {
          description: 'Memory usage percentage',
          tags: ['system', 'memory', 'health']
        }
      )
    ];
  }

  static errorOccurred(source: string, errorType: string, severity: 'low' | 'medium' | 'high'): Metric {
    const sourceDimension = { type: 'source' as any, value: source, displayLabel: source };
    const typeDimension = { type: 'category' as any, value: errorType, displayLabel: errorType };
    const severityDimension = { type: 'status' as any, value: severity, displayLabel: severity };
    
    return Metric.create(
      'error_count',
      MetricValue.counter(1, 'errors'),
      new DimensionCollection([sourceDimension, typeDimension, severityDimension] as any),
      MetricCategory.ERROR,
      source,
      {
        description: 'Error occurrence count',
        tags: ['error', errorType, severity]
      }
    );
  }

  // Getters
  getId(): MetricId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getValue(): MetricValue {
    return this.value;
  }

  getDimensions(): DimensionCollection {
    return this.dimensions;
  }

  getCategory(): MetricCategory {
    return this.category;
  }

  getSource(): string {
    return this.source;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  // Business methods
  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  matchesDimensions(filterDimensions: DimensionCollection): boolean {
    for (const filterDimension of filterDimensions.getAll()) {
      const metricDimension = this.dimensions.get(filterDimension.type);
      if (!metricDimension || metricDimension.value !== filterDimension.value) {
        return false;
      }
    }
    return true;
  }

  isInTimeRange(startTime: Date, endTime: Date): boolean {
    return this.timestamp >= startTime && this.timestamp <= endTime;
  }

  equals(other: Metric): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `${this.name}: ${this.value.displayValue} [${this.category}]`;
  }
}