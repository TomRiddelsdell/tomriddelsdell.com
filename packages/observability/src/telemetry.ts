/**
 * Main observability telemetry wrapper with OpenTelemetry SDK integration
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

import type { PlatformObservability, TelemetryConfig, ObservabilityAdapter } from './types.js';
import { StructuredLogger } from './logging.js';
import { MetricsCollector } from './metrics.js';
import { TracingManager } from './tracing.js';

/**
 * Platform-agnostic telemetry wrapper
 */
export class PortableTelemetry implements PlatformObservability {
  private sdk?: NodeSDK;
  public readonly log: StructuredLogger;
  public readonly metrics: MetricsCollector;
  public readonly tracing: TracingManager;
  private config: TelemetryConfig;

  constructor(config: TelemetryConfig) {
    this.config = config;
    this.log = new StructuredLogger(config.serviceName);
    this.metrics = new MetricsCollector(config);
    this.tracing = new TracingManager(config.serviceName);
    
    // Initialize SDK if not in edge runtime
    if (config.platform !== 'cloudflare') {
      this.initializeSDK();
    }
  }

  /**
   * Get Jaeger OTLP endpoint based on environment
   */
  private getJaegerEndpoint(): string {
    // Check for explicit OTLP endpoint
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      return process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    }

    // Check for Jaeger-specific endpoint (from Doppler in production)
    if (process.env.JAEGER_ENDPOINT) {
      return process.env.JAEGER_ENDPOINT;
    }

    // Default to local Jaeger for development
    return 'http://localhost:4318/v1/traces';
  }

  /**
   * Get OTLP headers (for authentication if needed)
   */
  private getOTLPHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Add authentication if configured (e.g., for Jaeger Cloud)
    if (process.env.JAEGER_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.JAEGER_AUTH_TOKEN}`;
    }

    return headers;
  }

  /**
   * Initialize OpenTelemetry SDK with all exporters and processors
   */
  private initializeSDK(): void {
    // Enable OpenTelemetry diagnostics in dev
    if (this.config.environment === 'development') {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
    }

    // Configure resource with service information
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: this.config.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: this.config.version,
      'service.platform': this.config.platform,
      'deployment.environment': this.config.environment,
    });

    // Configure OTLP trace exporter (Jaeger compatible)
    const jaegerEndpoint = this.getJaegerEndpoint();
    const traceExporter = new OTLPTraceExporter({
      url: jaegerEndpoint,
      headers: this.getOTLPHeaders(),
      timeoutMillis: 10000, // 10 second timeout
    });

    // Configure Prometheus metrics exporter
    const prometheusExporter = new PrometheusExporter({
      port: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
      preventServerStart: false,
    });

    // Configure batch span processor with environment-specific settings
    const exportIntervalMs = this.config.environment === 'production' ? 30000 : 5000;
    const spanProcessor = new BatchSpanProcessor(traceExporter, {
      maxQueueSize: 1000,
      maxExportBatchSize: 512,
      scheduledDelayMillis: exportIntervalMs,
      exportTimeoutMillis: 30000,
    });

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        // Auto-instrument HTTP requests
        new HttpInstrumentation({
          ignoreIncomingRequestHook: (req) => {
            // Ignore health check endpoints
            const url = req.url || '';
            return url.includes('/health') || url.includes('/metrics');
          },
        }),
      ],
      spanProcessor,
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      this.shutdown().catch((error) => {
        console.error('Error shutting down telemetry:', error);
        process.exit(1);
      });
    });
  }

  /**
   * Start the SDK
   */
  async start(): Promise<void> {
    if (this.sdk) {
      await this.sdk.start();
      this.log.info('OpenTelemetry SDK started', {
        platform: this.config.platform,
        environment: this.config.environment,
        jaegerEndpoint: this.getJaegerEndpoint(),
      });
    }
  }

  /**
   * Shutdown the SDK
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      this.log.info('Shutting down OpenTelemetry SDK');
      await this.sdk.shutdown();
    }
  }
}

/**
 * Factory function to create platform-specific observability instances
 */
export function createObservability(config: TelemetryConfig, adapter?: ObservabilityAdapter): PlatformObservability {
  // If adapter provided, use platform-specific implementation
  if (adapter) {
    return {
      log: adapter.createLogger(config),
      metrics: adapter.createMetrics(config),
      tracing: adapter.createTracing(config),
    };
  }

  // Otherwise use portable implementation
  return new PortableTelemetry(config);
}
