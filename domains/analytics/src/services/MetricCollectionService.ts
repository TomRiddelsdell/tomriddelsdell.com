import { Metric, MetricCategory } from '../entities/Metric';
import { MetricValue } from '../value-objects/MetricValue';
import { DimensionCollection, Dimension } from '../value-objects/Dimension';
import { IMetricRepository } from '../repositories/IMetricRepository';
import { DomainEventPublisher } from '../../../shared-kernel/src/domain-services/DomainEventPublisher';
import { MetricCollectedEvent } from '../events/AnalyticsEvents';

export class MetricCollectionService {
  constructor(
    private readonly metricRepository: IMetricRepository,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async recordMetric(
    name: string,
    value: MetricValue,
    category: MetricCategory,
    source: string,
    dimensions: DimensionCollection = new DimensionCollection(),
    options: {
      description?: string;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const metric = Metric.create(
      name,
      value,
      dimensions,
      category,
      source,
      options
    );

    await this.metricRepository.save(metric);
    
    // Publish metric collected event for real-time processing
    const event = new MetricCollectedEvent(
      metric.getId().toString(),
      name,
      value.value,
      category,
      source,
      dimensions.toFilterObject()
    );
    
    await this.eventPublisher.publish(event);
  }

  async recordBatch(metrics: Array<{
    name: string;
    value: MetricValue;
    category: MetricCategory;
    source: string;
    dimensions?: DimensionCollection;
    description?: string;
    tags?: string[];
  }>): Promise<void> {
    const metricEntities = metrics.map(m => 
      Metric.create(
        m.name,
        m.value,
        m.dimensions || new DimensionCollection(),
        m.category,
        m.source,
        {
          description: m.description,
          tags: m.tags
        }
      )
    );

    await this.metricRepository.saveMany(metricEntities);
  }

  async recordWorkflowMetrics(
    workflowId: string,
    userId: string,
    metrics: {
      executionTime?: number;
      status: 'success' | 'error';
      actionsExecuted?: number;
      errorMessage?: string;
    }
  ): Promise<void> {
    const dimensions = new DimensionCollection([
      Dimension.workflow(workflowId),
      Dimension.user(userId),
      Dimension.status(metrics.status)
    ]);

    const metricsToRecord = [];

    // Record execution count
    metricsToRecord.push({
      name: 'workflow_executions',
      value: MetricValue.counter(1),
      category: MetricCategory.BUSINESS,
      source: 'workflow-engine',
      dimensions,
      tags: ['workflow', 'execution', metrics.status]
    });

    // Record execution time if provided
    if (metrics.executionTime !== undefined) {
      metricsToRecord.push({
        name: 'workflow_execution_time',
        value: MetricValue.timer(metrics.executionTime),
        category: MetricCategory.PERFORMANCE,
        source: 'workflow-engine',
        dimensions,
        tags: ['workflow', 'performance']
      });
    }

    // Record actions executed if provided
    if (metrics.actionsExecuted !== undefined) {
      metricsToRecord.push({
        name: 'workflow_actions_executed',
        value: MetricValue.counter(metrics.actionsExecuted),
        category: MetricCategory.BUSINESS,
        source: 'workflow-engine',
        dimensions,
        tags: ['workflow', 'actions']
      });
    }

    // Record error if status is error
    if (metrics.status === 'error') {
      metricsToRecord.push({
        name: 'workflow_errors',
        value: MetricValue.counter(1),
        category: MetricCategory.ERROR,
        source: 'workflow-engine',
        dimensions,
        tags: ['workflow', 'error']
      });
    }

    await this.recordBatch(metricsToRecord);
  }

  async recordUserMetrics(
    userId: string,
    action: string,
    source: string = 'web',
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    const dimensions = new DimensionCollection([
      Dimension.user(userId),
      Dimension.source(source),
      Dimension.category(action)
    ]);

    await this.recordMetric(
      'user_actions',
      MetricValue.counter(1),
      MetricCategory.USAGE,
      'user-service',
      dimensions,
      {
        description: `User action: ${action}`,
        tags: ['user', 'action', action]
      }
    );
  }

  async recordApiMetrics(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    const dimensions = new DimensionCollection([
      Dimension.source(endpoint),
      Dimension.category(method),
      Dimension.status(statusCode.toString())
    ]);

    if (userId) {
      dimensions.add(Dimension.user(userId));
    }

    const metricsToRecord = [];

    // Record API request count
    metricsToRecord.push({
      name: 'api_requests',
      value: MetricValue.counter(1),
      category: MetricCategory.USAGE,
      source: 'api-gateway',
      dimensions,
      tags: ['api', 'request', method.toLowerCase()]
    });

    // Record response time
    metricsToRecord.push({
      name: 'api_response_time',
      value: MetricValue.timer(responseTime),
      category: MetricCategory.PERFORMANCE,
      source: 'api-gateway',
      dimensions,
      tags: ['api', 'performance']
    });

    // Record errors for 4xx and 5xx status codes
    if (statusCode >= 400) {
      metricsToRecord.push({
        name: 'api_errors',
        value: MetricValue.counter(1),
        category: MetricCategory.ERROR,
        source: 'api-gateway',
        dimensions,
        tags: ['api', 'error', `status-${Math.floor(statusCode / 100)}xx`]
      });
    }

    await this.recordBatch(metricsToRecord);
  }

  async recordSystemMetrics(
    component: string,
    metrics: {
      cpuUsage?: number;
      memoryUsage?: number;
      diskUsage?: number;
      networkIn?: number;
      networkOut?: number;
    }
  ): Promise<void> {
    const dimensions = new DimensionCollection([
      Dimension.source(component)
    ]);

    const metricsToRecord = [];

    if (metrics.cpuUsage !== undefined) {
      metricsToRecord.push({
        name: 'cpu_usage',
        value: MetricValue.percentage(metrics.cpuUsage),
        category: MetricCategory.SYSTEM,
        source: 'system-monitor',
        dimensions,
        tags: ['system', 'cpu']
      });
    }

    if (metrics.memoryUsage !== undefined) {
      metricsToRecord.push({
        name: 'memory_usage',
        value: MetricValue.percentage(metrics.memoryUsage),
        category: MetricCategory.SYSTEM,
        source: 'system-monitor',
        dimensions,
        tags: ['system', 'memory']
      });
    }

    if (metrics.diskUsage !== undefined) {
      metricsToRecord.push({
        name: 'disk_usage',
        value: MetricValue.percentage(metrics.diskUsage),
        category: MetricCategory.SYSTEM,
        source: 'system-monitor',
        dimensions,
        tags: ['system', 'disk']
      });
    }

    if (metrics.networkIn !== undefined) {
      metricsToRecord.push({
        name: 'network_in',
        value: MetricValue.bytes(metrics.networkIn),
        category: MetricCategory.SYSTEM,
        source: 'system-monitor',
        dimensions,
        tags: ['system', 'network', 'inbound']
      });
    }

    if (metrics.networkOut !== undefined) {
      metricsToRecord.push({
        name: 'network_out',
        value: MetricValue.bytes(metrics.networkOut),
        category: MetricCategory.SYSTEM,
        source: 'system-monitor',
        dimensions,
        tags: ['system', 'network', 'outbound']
      });
    }

    await this.recordBatch(metricsToRecord);
  }
}