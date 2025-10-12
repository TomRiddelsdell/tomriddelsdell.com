/**
 * Core types for edge runtime observability
 * Standalone types with no external dependencies
 */

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  userId?: string;
  aggregateId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
}

export interface MetricTags {
  service?: string;
  environment?: string;
  version?: string;
  [key: string]: string | undefined;
}

export interface Counter {
  inc(name: string, value: number, tags?: MetricTags): void;
}

export interface Histogram {
  observe(name: string, value: number, tags?: MetricTags): void;
}

export interface Gauge {
  set(name: string, value: number, tags?: MetricTags): void;
}

export interface Metrics {
  counter: Counter;
  histogram: Histogram;
  gauge: Gauge;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: string | number | boolean): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
  end(): void;
}

export interface TraceContext {
  traceId: string;
  correlationId: string;
}

export interface Tracing {
  startSpan(name: string, context?: SpanContext): Span;
  createTrace(correlationId?: string): TraceContext;
}

export interface PlatformObservability {
  log: Logger;
  metrics: Metrics;
  tracing: Tracing;
}

export interface TelemetryConfig {
  serviceName: string;
  version: string;
  environment: string;
  platform: 'cloudflare' | 'edge';
  samplingRate?: number;
  exportInterval?: number;
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
