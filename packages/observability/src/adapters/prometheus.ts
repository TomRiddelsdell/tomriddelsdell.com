/**
 * Prometheus adapter for observability
 * 
 * Provides /metrics endpoint for Prometheus scraping
 */

import type { ObservabilityAdapter, TelemetryConfig, Logger, Metrics, Tracing } from '../types.js';
import { StructuredLogger } from '../logging.js';
import { MetricsCollector } from '../metrics.js';
import { TracingManager } from '../tracing.js';

export class PrometheusAdapter implements ObservabilityAdapter {
  private metricsStore: Map<string, { value: number; tags: Record<string, string> }> = new Map();

  createLogger(config: TelemetryConfig): Logger {
    return new StructuredLogger(config.serviceName);
  }

  createMetrics(config: TelemetryConfig): Metrics {
    return new MetricsCollector(config);
  }

  createTracing(config: TelemetryConfig): Tracing {
    return new TracingManager(config.serviceName);
  }

  /**
   * Export metrics in Prometheus text format
   */
  async exportMetrics(metrics: Record<string, number>): Promise<void> {
    // Store metrics for /metrics endpoint
    for (const [name, value] of Object.entries(metrics)) {
      this.metricsStore.set(name, { value, tags: {} });
    }
  }

  /**
   * Get metrics in Prometheus exposition format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const [name, data] of this.metricsStore.entries()) {
      const metricName = name.replace(/\./g, '_');
      const tagsStr = Object.entries(data.tags)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      
      lines.push(`# TYPE ${metricName} gauge`);
      if (tagsStr) {
        lines.push(`${metricName}{${tagsStr}} ${data.value}`);
      } else {
        lines.push(`${metricName} ${data.value}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Export traces (no-op for Prometheus)
   */
  async exportTraces(_traces: any[]): Promise<void> {
    // Prometheus doesn't handle traces
  }

  /**
   * Export logs (no-op for Prometheus)
   */
  async exportLogs(_logs: any[]): Promise<void> {
    // Prometheus doesn't handle logs
  }
}
