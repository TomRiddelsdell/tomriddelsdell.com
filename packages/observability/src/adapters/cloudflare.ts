/**
 * Cloudflare Workers adapter for observability
 * 
 * Note: Cloudflare Workers have limited OpenTelemetry support,
 * so this adapter uses Cloudflare Analytics Engine and logging
 */

import type { ObservabilityAdapter, TelemetryConfig, Logger, Metrics, Tracing } from '../types.js';
import { StructuredLogger } from '../logging.js';
import { MetricsCollector } from '../metrics.js';
import { TracingManager } from '../tracing.js';

export class CloudflareAdapter implements ObservabilityAdapter {
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
   * Export metrics to Cloudflare Analytics Engine
   */
  async exportMetrics(metrics: Record<string, number>): Promise<void> {
    // Note: This requires Cloudflare Analytics Engine binding
    // https://developers.cloudflare.com/analytics/analytics-engine/
    if (typeof globalThis !== 'undefined' && 'ANALYTICS' in globalThis) {
      const analytics = (globalThis as any).ANALYTICS;
      for (const [name, value] of Object.entries(metrics)) {
        await analytics.writeDataPoint({
          blobs: [name],
          doubles: [value],
          indexes: [],
        });
      }
    } else {
      console.warn('Cloudflare Analytics Engine not available');
    }
  }

  /**
   * Export traces to Cloudflare logging
   */
  async exportTraces(traces: any[]): Promise<void> {
    // Cloudflare Workers don't support traditional tracing
    // Log trace spans as structured logs instead
    traces.forEach(trace => {
      console.log(JSON.stringify({
        type: 'trace',
        ...trace,
      }));
    });
  }

  /**
   * Export logs to Cloudflare console
   */
  async exportLogs(logs: any[]): Promise<void> {
    logs.forEach(log => {
      console.log(JSON.stringify(log));
    });
  }
}
