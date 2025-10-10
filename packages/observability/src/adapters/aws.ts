/**
 * AWS Lambda / AWS environment adapter for observability
 * 
 * Integrates with AWS X-Ray, CloudWatch Logs, and CloudWatch Metrics
 */

import type { ObservabilityAdapter, TelemetryConfig, Logger, Metrics, Tracing } from '../types.js';
import { StructuredLogger } from '../logging.js';
import { MetricsCollector } from '../metrics.js';
import { TracingManager } from '../tracing.js';

export class AWSAdapter implements ObservabilityAdapter {
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
   * Export metrics to CloudWatch
   */
  async exportMetrics(metrics: Record<string, number>): Promise<void> {
    // In AWS Lambda, stdout logs are automatically sent to CloudWatch
    // We output metrics in CloudWatch EMF (Embedded Metric Format)
    console.log(JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [{
          Namespace: 'Platform/Observability',
          Dimensions: [['Service']],
          Metrics: Object.keys(metrics).map(name => ({
            Name: name,
            Unit: 'None',
          })),
        }],
      },
      Service: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
      ...metrics,
    }));
  }

  /**
   * Export traces to AWS X-Ray
   */
  async exportTraces(traces: any[]): Promise<void> {
    // AWS X-Ray integration is handled by OpenTelemetry SDK
    // with AWS X-Ray exporter configured via environment variables:
    // OTEL_TRACES_EXPORTER=xray
    // OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:2000
    
    // Traces are automatically exported by the SDK
    // This method is here for adapter interface compliance
  }

  /**
   * Export logs to CloudWatch Logs
   */
  async exportLogs(logs: any[]): Promise<void> {
    // CloudWatch automatically captures stdout/stderr from Lambda
    logs.forEach(log => {
      console.log(JSON.stringify(log));
    });
  }
}
