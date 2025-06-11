import { DomainEvent } from '../../../shared-kernel/src/events/DomainEvent';

export class MetricCollectedEvent extends DomainEvent {
  constructor(
    metricId: string,
    public readonly metricName: string,
    public readonly value: number,
    public readonly category: string,
    public readonly source: string,
    public readonly dimensions: Record<string, string>
  ) {
    super(metricId, 'MetricCollected');
  }

  getPayload() {
    return {
      metricName: this.metricName,
      value: this.value,
      category: this.category,
      source: this.source,
      dimensions: this.dimensions
    };
  }
}

export class ThresholdExceededEvent extends DomainEvent {
  constructor(
    alertId: string,
    public readonly alertName: string,
    public readonly metricName: string,
    public readonly currentValue: number,
    public readonly thresholdValue: number,
    public readonly severity: string
  ) {
    super(alertId, 'ThresholdExceeded');
  }

  getPayload() {
    return {
      alertName: this.alertName,
      metricName: this.metricName,
      currentValue: this.currentValue,
      thresholdValue: this.thresholdValue,
      severity: this.severity
    };
  }
}

export class SystemHealthDegradedEvent extends DomainEvent {
  constructor(
    componentId: string,
    public readonly componentName: string,
    public readonly previousStatus: string,
    public readonly currentStatus: string,
    public readonly healthScore: number
  ) {
    super(componentId, 'SystemHealthDegraded');
  }

  getPayload() {
    return {
      componentName: this.componentName,
      previousStatus: this.previousStatus,
      currentStatus: this.currentStatus,
      healthScore: this.healthScore
    };
  }
}

export class LogAnomalyDetectedEvent extends DomainEvent {
  constructor(
    logId: string,
    public readonly source: string,
    public readonly anomalyType: string,
    public readonly severity: string,
    public readonly description: string
  ) {
    super(logId, 'LogAnomalyDetected');
  }

  getPayload() {
    return {
      source: this.source,
      anomalyType: this.anomalyType,
      severity: this.severity,
      description: this.description
    };
  }
}

export class ReportScheduledEvent extends DomainEvent {
  constructor(
    reportId: string,
    public readonly reportName: string,
    public readonly scheduleFrequency: string,
    public readonly nextRunTime: Date
  ) {
    super(reportId, 'ReportScheduled');
  }

  getPayload() {
    return {
      reportName: this.reportName,
      scheduleFrequency: this.scheduleFrequency,
      nextRunTime: this.nextRunTime.toISOString()
    };
  }
}