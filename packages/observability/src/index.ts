/**
 * @platform/observability - OpenTelemetry-based observability package
 */

// Core telemetry
export { PortableTelemetry, createObservability } from './telemetry.js';

// Implementations
export { StructuredLogger } from './logging.js';
export { MetricsCollector, TechnicalMetrics } from './metrics.js';
export { TracingManager, SpanAttributes, SpanHelper } from './tracing.js';

// Edge runtime adapters
export {
  CloudflareEdgeAdapter,
  EdgeStructuredLogger,
  EdgeMetricsCollector,
  EdgeTracingManager,
} from './adapters/cloudflare-edge.js';

// Type exports
export type {
  LogEntry,
  Logger,
  Counter,
  Histogram,
  Gauge,
  Metrics,
  MetricTags,
  Span,
  SpanContext,
  TraceContext,
  Tracing,
  PlatformObservability,
  ObservabilityAdapter,
  TelemetryConfig,
} from './types.js';
