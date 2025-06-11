import { Alert, AlertId, AlertStatus } from '../entities/Alert';
import { MetricValue } from '../value-objects/MetricValue';
import { Threshold } from '../value-objects/Threshold';
import { DimensionCollection } from '../value-objects/Dimension';
import { IAlertRepository } from '../repositories/IAlertRepository';
import { IMetricRepository } from '../repositories/IMetricRepository';
import { DomainEventPublisher } from '../../../shared-kernel/src/domain-services/DomainEventPublisher';

export class AlertService {
  constructor(
    private readonly alertRepository: IAlertRepository,
    private readonly metricRepository: IMetricRepository,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  async createAlert(
    name: string,
    metricName: string,
    threshold: Threshold,
    dimensions: DimensionCollection,
    configuration: {
      channels: string[];
      cooldownMinutes: number;
      maxTriggersPerHour: number;
      autoResolve: boolean;
      autoResolveAfterMinutes?: number;
    },
    description?: string
  ): Promise<Alert> {
    const alert = Alert.create(
      name,
      metricName,
      threshold,
      dimensions,
      configuration as any,
      { description }
    );

    await this.alertRepository.save(alert);
    return alert;
  }

  async evaluateMetric(metricValue: MetricValue, metricName: string): Promise<void> {
    const alerts = await this.alertRepository.findByMetricName(metricName);
    
    for (const alert of alerts) {
      const wasTriggered = alert.evaluate(metricValue);
      
      if (wasTriggered || alert.getUncommittedEvents().length > 0) {
        await this.alertRepository.save(alert);
        
        // Publish domain events
        const events = alert.getUncommittedEvents();
        for (const event of events) {
          await this.eventPublisher.publish(event);
        }
        alert.markEventsAsCommitted();
      }
    }
  }

  async evaluateAllActiveAlerts(): Promise<void> {
    const activeAlerts = await this.alertRepository.findActiveAlerts();
    
    for (const alert of activeAlerts) {
      // Get recent metrics for this alert's metric name
      const recentMetrics = await this.metricRepository.findRecentMetrics(
        alert.getMetricName(),
        5 // Last 5 minutes
      );

      if (recentMetrics.length > 0) {
        // Use the most recent metric value
        const latestMetric = recentMetrics[0];
        const wasTriggered = alert.evaluate(latestMetric.getValue());
        
        if (wasTriggered || alert.getUncommittedEvents().length > 0) {
          await this.alertRepository.save(alert);
          
          // Publish domain events
          const events = alert.getUncommittedEvents();
          for (const event of events) {
            await this.eventPublisher.publish(event);
          }
          alert.markEventsAsCommitted();
        }
      }
    }
  }

  async resolveAlert(alertId: AlertId, autoResolved: boolean = false): Promise<void> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId.toString()} not found`);
    }

    alert.resolve(autoResolved);
    await this.alertRepository.save(alert);
    
    // Publish domain events
    const events = alert.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
    alert.markEventsAsCommitted();
  }

  async suppressAlert(alertId: AlertId): Promise<void> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId.toString()} not found`);
    }

    alert.suppress();
    await this.alertRepository.save(alert);
  }

  async enableAlert(alertId: AlertId): Promise<void> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId.toString()} not found`);
    }

    alert.enable();
    await this.alertRepository.save(alert);
  }

  async disableAlert(alertId: AlertId): Promise<void> {
    const alert = await this.alertRepository.findById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId.toString()} not found`);
    }

    alert.disable();
    await this.alertRepository.save(alert);
  }

  async getAlertsByStatus(status: AlertStatus): Promise<Alert[]> {
    return await this.alertRepository.findByStatus(status);
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return await this.alertRepository.findActiveAlerts();
  }

  async getAlertsSummary(): Promise<{
    total: number;
    active: number;
    triggered: number;
    resolved: number;
    suppressed: number;
    disabled: number;
  }> {
    const [total, active, triggered, resolved, suppressed, disabled] = await Promise.all([
      this.alertRepository.count(),
      this.alertRepository.countByStatus(AlertStatus.ACTIVE),
      this.alertRepository.countByStatus(AlertStatus.TRIGGERED),
      this.alertRepository.countByStatus(AlertStatus.RESOLVED),
      this.alertRepository.countByStatus(AlertStatus.SUPPRESSED),
      this.alertRepository.countByStatus(AlertStatus.DISABLED)
    ]);

    return {
      total,
      active,
      triggered,
      resolved,
      suppressed,
      disabled
    };
  }

  // Factory methods for common alerts
  async createSystemHealthAlerts(): Promise<Alert[]> {
    const alerts = [
      Alert.highCpuUsage(85),
      Alert.workflowFailureRate(10),
      Alert.apiResponseTime(3000)
    ];

    for (const alert of alerts) {
      await this.alertRepository.save(alert);
    }

    return alerts;
  }
}