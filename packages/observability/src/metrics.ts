/**
 * Metrics collection implementation with OpenTelemetry
 */

import { metrics as otMetrics } from '@opentelemetry/api';
import type { Counter, Histogram, Gauge, Metrics, MetricTags } from './types.js';

export class MetricsCollector implements Metrics {
  private serviceName: string;
  private environment: string;
  private version: string;
  private meter: ReturnType<typeof otMetrics.getMeter>;

  constructor(config: { serviceName: string; environment: string; version: string }) {
    this.serviceName = config.serviceName;
    this.environment = config.environment;
    this.version = config.version;
    this.meter = otMetrics.getMeter('@platform/observability', '1.0.0');
  }

  /**
   * Add standard tags to metric tags
   */
  private addStandardTags(tags?: MetricTags): Record<string, string> {
    return {
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      ...tags,
    } as Record<string, string>;
  }

  counter: Counter = {
    inc: (name: string, value: number, tags?: MetricTags): void => {
      const counter = this.meter.createCounter(name, {
        description: `Counter metric: ${name}`,
      });
      counter.add(value, this.addStandardTags(tags));
    },
  };

  histogram: Histogram = {
    observe: (name: string, value: number, tags?: MetricTags): void => {
      const histogram = this.meter.createHistogram(name, {
        description: `Histogram metric: ${name}`,
      });
      histogram.record(value, this.addStandardTags(tags));
    },
  };

  gauge: Gauge = {
    set: (name: string, value: number, tags?: MetricTags): void => {
      const gauge = this.meter.createObservableGauge(name, {
        description: `Gauge metric: ${name}`,
      });
      
      // Create a callback that returns the current value
      gauge.addCallback((observableResult) => {
        observableResult.observe(value, this.addStandardTags(tags));
      });
    },
  };
}

/**
 * Pre-defined technical metrics from ADR-010
 */
export const TechnicalMetrics = {
  EVENT_PROCESSING_LATENCY: 'event.processing.latency',
  PROJECTION_LAG_SECONDS: 'projection.lag.seconds',
  HTTP_REQUEST_DURATION: 'http.request.duration',
  DATABASE_CONNECTION_POOL_USAGE: 'database.connection.pool.usage',
  ERROR_RATE_BY_SERVICE: 'error.rate.by.service',
} as const;
