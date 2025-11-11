/**
 * Cloudflare Workers/Pages Edge Runtime Adapter for observability
 *
 * **Technical Constraints**:
 * - Edge runtime lacks full Node.js API support
 * - OpenTelemetry SDK not fully compatible with V8 isolates
 * - Distributed tracing limited to correlation IDs in logs
 *
 * **DDD Consideration**:
 * This adapter provides degraded observability capabilities due to
 * platform limitations, NOT because the Landing Page is a different
 * bounded context. All services in the Platform Monolith (Landing Page,
 * Identity, Notifications, Service Discovery) share the same observability
 * contract, but runtime adapters may provide different implementation fidelity.
 *
 * **Implementation**:
 * Uses simplified logging, metrics collection, and tracing that works
 * in Cloudflare Workers, Next.js Edge Runtime, and Cloudflare Pages.
 */

import type {
  TelemetryConfig,
  Logger,
  Metrics,
  Tracing,
  LogEntry,
  Span,
  SpanContext,
  TraceContext,
  Counter,
  Histogram,
  Gauge,
  MetricTags,
  PlatformObservability,
} from './types'

// Re-export types for consumer convenience
export type {
  TelemetryConfig,
  Logger,
  Metrics,
  Tracing,
  LogEntry,
  Span,
  SpanContext,
  TraceContext,
  Counter,
  Histogram,
  Gauge,
  MetricTags,
  PlatformObservability,
} from './types'

export { TechnicalMetrics } from './types'

/**
 * Edge-compatible structured logger
 * Uses console output captured by Cloudflare/Next.js
 */
export class EdgeStructuredLogger implements Logger {
  constructor(private serviceName: string) {}

  /**
   * Generate a correlation ID for request tracing
   */
  static generateCorrelationId(): string {
    // Use crypto.randomUUID if available (edge runtime), fallback to timestamp+random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...(context && { metadata: context }),
    }

    // Add error details if present
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    // Extract common fields from context
    if (context) {
      if (context.correlationId)
        entry.correlationId = String(context.correlationId)
      if (context.traceId) entry.traceId = String(context.traceId)
      if (context.spanId) entry.spanId = String(context.spanId)
      if (context.userId) entry.userId = String(context.userId)
      if (context.aggregateId) entry.aggregateId = String(context.aggregateId)
    }

    return entry
  }

  /**
   * Output log entry as JSON to stdout
   */
  private output(entry: LogEntry): void {
    const json = JSON.stringify(entry)

    // Use console methods for proper stream routing
    if (entry.level === 'error') {
      console.error(json)
    } else if (entry.level === 'warn') {
      console.warn(json)
    } else if (entry.level === 'debug') {
      console.debug(json)
    } else {
      console.log(json)
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, context)
    this.output(entry)
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const entry = this.createLogEntry('error', message, context, error)
    this.output(entry)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('debug', message, context)
    this.output(entry)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('warn', message, context)
    this.output(entry)
  }
}

/**
 * Edge-compatible metrics collector
 * Stores metrics in memory and logs them as structured data
 */
export class EdgeMetricsCollector implements Metrics {
  private serviceName: string
  private environment: string
  private version: string
  private metricsStore = new Map<
    string,
    { value: number; type: string; tags: MetricTags }
  >()

  constructor(config: TelemetryConfig) {
    this.serviceName = config.serviceName
    this.environment = config.environment
    this.version = config.version
  }

  /**
   * Add standard tags to metric tags
   */
  private addStandardTags(tags?: MetricTags): MetricTags {
    return {
      service: this.serviceName,
      environment: this.environment,
      version: this.version,
      ...tags,
    }
  }

  /**
   * Store and log metric
   */
  private recordMetric(
    name: string,
    value: number,
    type: string,
    tags?: MetricTags
  ): void {
    const enrichedTags = this.addStandardTags(tags)

    // Store in memory
    this.metricsStore.set(name, { value, type, tags: enrichedTags })

    // Log as structured data for aggregation
    console.log(
      JSON.stringify({
        type: 'metric',
        timestamp: new Date().toISOString(),
        metric: {
          name,
          value,
          type,
          tags: enrichedTags,
        },
      })
    )
  }

  counter: Counter = {
    inc: (name: string, value: number, tags?: MetricTags): void => {
      this.recordMetric(name, value, 'counter', tags)
    },
  }

  histogram: Histogram = {
    observe: (name: string, value: number, tags?: MetricTags): void => {
      this.recordMetric(name, value, 'histogram', tags)
    },
  }

  gauge: Gauge = {
    set: (name: string, value: number, tags?: MetricTags): void => {
      this.recordMetric(name, value, 'gauge', tags)
    },
  }

  /**
   * Get all collected metrics (useful for /metrics endpoint)
   */
  getMetrics(): Map<string, { value: number; type: string; tags: MetricTags }> {
    return this.metricsStore
  }
}

/**
 * Edge-compatible tracing manager
 * Uses correlation IDs and logs trace spans as structured data
 */
export class EdgeTracingManager implements Tracing {
  constructor(private serviceName: string) {}

  /**
   * Edge-compatible span implementation
   */
  private createSpan(
    name: string,
    traceId: string,
    spanId: string,
    parentSpanId?: string
  ): Span {
    const startTime = Date.now()
    const attributes: Record<string, string | number | boolean> = {
      'service.name': this.serviceName,
    }

    return {
      spanContext: () => ({
        traceId,
        spanId,
        traceFlags: 1, // Sampled
      }),

      setAttribute: (key: string, value: string | number | boolean): void => {
        attributes[key] = value
      },

      setAttributes: (
        attrs: Record<string, string | number | boolean>
      ): void => {
        Object.assign(attributes, attrs)
      },

      end: (): void => {
        const duration = Date.now() - startTime

        // Log span as structured data
        console.log(
          JSON.stringify({
            type: 'span',
            timestamp: new Date().toISOString(),
            span: {
              name,
              traceId,
              spanId,
              parentSpanId,
              duration,
              attributes,
            },
          })
        )
      },
    }
  }

  startSpan(name: string, parentContext?: SpanContext): Span {
    const traceId =
      parentContext?.traceId || EdgeStructuredLogger.generateCorrelationId()
    const spanId = EdgeStructuredLogger.generateCorrelationId()
    const parentSpanId = parentContext?.spanId

    return this.createSpan(name, traceId, spanId, parentSpanId)
  }

  createTrace(correlationId?: string): TraceContext {
    const id = correlationId || EdgeStructuredLogger.generateCorrelationId()
    return {
      traceId: id,
      correlationId: id,
    }
  }
}

/**
 * Cloudflare Edge Runtime Adapter
 * Creates observability instances for edge runtimes
 */
export class CloudflareEdgeAdapter {
  createLogger(config: TelemetryConfig): Logger {
    return new EdgeStructuredLogger(config.serviceName)
  }

  createMetrics(config: TelemetryConfig): Metrics {
    return new EdgeMetricsCollector(config)
  }

  createTracing(config: TelemetryConfig): Tracing {
    return new EdgeTracingManager(config.serviceName)
  }

  /**
   * Create a complete observability instance
   */
  createObservability(config: TelemetryConfig): PlatformObservability {
    return {
      log: this.createLogger(config),
      metrics: this.createMetrics(config),
      tracing: this.createTracing(config),
    }
  }

  /**
   * Export metrics to Cloudflare Analytics Engine (if available)
   */
  async exportMetrics(metrics: Record<string, number>): Promise<void> {
    // Check for Cloudflare Analytics Engine binding
    if (typeof globalThis !== 'undefined' && 'ANALYTICS' in globalThis) {
      const analytics = (globalThis as any).ANALYTICS
      for (const [name, value] of Object.entries(metrics)) {
        try {
          await analytics.writeDataPoint({
            blobs: [name],
            doubles: [value],
            indexes: [],
          })
        } catch (error) {
          console.warn('Failed to write to Cloudflare Analytics Engine:', error)
        }
      }
    } else {
      // Fallback: log metrics as structured data
      console.log(
        JSON.stringify({
          type: 'metrics_export',
          timestamp: new Date().toISOString(),
          metrics,
        })
      )
    }
  }

  /**
   * Export traces to structured logs
   */
  async exportTraces(traces: TraceContext[]): Promise<void> {
    traces.forEach((trace) => {
      console.log(
        JSON.stringify({
          type: 'trace_export',
          timestamp: new Date().toISOString(),
          trace,
        })
      )
    })
  }

  /**
   * Export logs (already handled by console output)
   */
  async exportLogs(logs: LogEntry[]): Promise<void> {
    logs.forEach((log) => {
      console.log(JSON.stringify(log))
    })
  }
}

/**
 * Convenience function to create observability instance
 *
 * @example
 * ```ts
 * import { createEdgeObservability } from '@platform/observability-edge';
 *
 * const observability = createEdgeObservability({
 *   serviceName: 'platform-modular-monolith',
 *   version: '1.0.0',
 *   environment: 'production',
 *   platform: 'cloudflare',
 * });
 *
 * observability.log.info('Application started');
 * ```
 */
export function createEdgeObservability(
  config: TelemetryConfig
): PlatformObservability {
  const adapter = new CloudflareEdgeAdapter()
  return adapter.createObservability(config)
}
