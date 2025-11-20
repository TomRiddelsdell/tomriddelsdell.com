/**
 * Core types for platform-agnostic observability
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

/**
 * Platform-specific adapter interface for exporting telemetry
 */
export interface ObservabilityAdapter {
  createLogger(config: TelemetryConfig): Logger;
  createMetrics(config: TelemetryConfig): Metrics;
  createTracing(config: TelemetryConfig): Tracing;
  exportMetrics?(metrics: Record<string, number>): Promise<void>;
  exportTraces?(traces: TraceContext[]): Promise<void>;
  exportLogs?(logs: LogEntry[]): Promise<void>;
}

export interface TelemetryConfig {
  serviceName: string;
  version: string;
  environment: string;
  platform: 'cloudflare' | 'aws' | 'node' | 'prometheus';
  samplingRate?: number;
  exportInterval?: number;
}
