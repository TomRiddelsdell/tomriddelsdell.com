// packages/shared-infra/src/observability/implementations/edge.ts
/**
 * Edge Runtime Implementation (Cloudflare Workers, Next.js Edge)
 *
 * Uses HTTP-based OTLP export since OpenTelemetry NodeSDK
 * is incompatible with V8 isolate runtimes.
 *
 * This is a stub implementation that logs to console.
 * Full OTLP HTTP export will be implemented in future work.
 */
import type {
  Observability,
  ObservabilityConfig,
  Logger,
  Metrics,
  EventSourcingMetrics,
  Tracing,
  TraceContext,
} from '../types'

/**
 * Edge-compatible observability implementation
 * Zero Node.js dependencies
 */
export class EdgeObservability implements Observability {
  private logger: Logger
  private metricsCollector: Metrics
  private tracingManager: Tracing

  constructor(config: ObservabilityConfig) {
    this.logger = new EdgeLogger(config)
    this.metricsCollector = new EdgeMetrics(config)
    this.tracingManager = new EdgeTracing(config)
  }

  get log(): Logger {
    return this.logger
  }

  get metrics(): Metrics {
    return this.metricsCollector
  }

  get tracing(): Tracing {
    return this.tracingManager
  }
}

/**
 * Edge logger using structured console logging
 */
class EdgeLogger implements Logger {
  constructor(private config: ObservabilityConfig) {}

  private log(
    level: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.serviceName,
      environment: this.config.environment,
      message,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(context && { context }),
    }

    console.log(JSON.stringify(logEntry))
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, undefined, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, undefined, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, undefined, context)
  }

  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log('error', message, error, context)
  }
}

/**
 * Edge metrics - stub implementation
 * Logs metrics as JSON for collection by observability backend
 */
class EdgeMetrics implements Metrics {
  public readonly eventSourcing: EventSourcingMetrics

  constructor(private config: ObservabilityConfig) {
    this.eventSourcing = new EdgeEventSourcingMetrics()
  }

  counter(name: string, value: number, labels?: Record<string, string>): void {
    console.log(
      JSON.stringify({
        type: 'counter',
        name,
        value,
        labels,
        service: this.config.serviceName,
      })
    )
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    console.log(
      JSON.stringify({
        type: 'gauge',
        name,
        value,
        labels,
        service: this.config.serviceName,
      })
    )
  }

  histogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    console.log(
      JSON.stringify({
        type: 'histogram',
        name,
        value,
        labels,
        service: this.config.serviceName,
      })
    )
  }
}

/**
 * Edge Event Sourcing metrics - stub implementation
 */
class EdgeEventSourcingMetrics implements EventSourcingMetrics {
  eventsPerCommit(count: number, labels: { aggregate_type: string }): void {
    console.log(
      JSON.stringify({
        type: 'histogram',
        name: 'events_per_commit',
        value: count,
        labels,
      })
    )
  }

  aggregateSize(
    eventCount: number,
    labels: { aggregate_id: string; aggregate_type: string }
  ): void {
    console.log(
      JSON.stringify({
        type: 'histogram',
        name: 'aggregate_size_events',
        value: eventCount,
        labels,
      })
    )
  }

  concurrencyConflict(labels: {
    aggregate_id: string
    expected_version: number
    actual_version: number
  }): void {
    console.log(
      JSON.stringify({
        type: 'counter',
        name: 'event_store_concurrency_conflicts_total',
        value: 1,
        labels,
      })
    )
  }

  projectionLag(
    seconds: number,
    labels: { projection_name: string; event_type: string }
  ): void {
    console.log(
      JSON.stringify({
        type: 'gauge',
        name: 'projection_lag_seconds',
        value: seconds,
        labels,
      })
    )
  }

  projectionThroughput(
    eventsPerSecond: number,
    labels: { projection_name: string }
  ): void {
    console.log(
      JSON.stringify({
        type: 'counter',
        name: 'projection_throughput_events_per_second',
        value: eventsPerSecond,
        labels,
      })
    )
  }

  projectionError(labels: {
    projection_name: string
    error_type: string
  }): void {
    console.log(
      JSON.stringify({
        type: 'counter',
        name: 'projection_errors_total',
        value: 1,
        labels,
      })
    )
  }

  snapshotOperation(
    operation: 'created' | 'loaded' | 'skipped',
    labels: {
      aggregate_type: string
      aggregate_version: number
      snapshot_size_bytes?: number
    }
  ): void {
    console.log(
      JSON.stringify({
        type: 'counter',
        name: 'snapshot_operations_total',
        value: 1,
        labels: { ...labels, operation },
      })
    )
  }

  snapshotHitRatio(ratio: number, labels: { aggregate_type: string }): void {
    console.log(
      JSON.stringify({
        type: 'gauge',
        name: 'snapshot_hit_ratio',
        value: ratio,
        labels,
      })
    )
  }

  eventsReplayed(
    count: number,
    labels: {
      aggregate_id: string
      load_source: 'snapshot' | 'full_replay'
    }
  ): void {
    console.log(
      JSON.stringify({
        type: 'histogram',
        name: 'events_replayed_count',
        value: count,
        labels,
      })
    )
  }

  eventStoreWriteLatency(
    milliseconds: number,
    labels: {
      operation: 'append' | 'load' | 'snapshot'
      events_count?: number
    }
  ): void {
    console.log(
      JSON.stringify({
        type: 'histogram',
        name: 'event_store_write_latency_ms',
        value: milliseconds,
        labels,
      })
    )
  }
}

/**
 * Edge tracing using correlation IDs and structured logging
 * Simulates spans via JSON logs with trace context
 */
class EdgeTracing implements Tracing {
  private currentTraceId?: string

  constructor(private config: ObservabilityConfig) {}

  async trace<T>(
    operationName: string,
    fn: (context: TraceContext) => Promise<T>,
    metadata?: Record<string, string | number | boolean>
  ): Promise<T> {
    const traceId = this.generateTraceId()
    const spanId = this.generateSpanId()
    const startTime = Date.now()

    this.currentTraceId = traceId

    const context = new EdgeTraceContext()

    // Add trace metadata to context
    context.addMetadata('trace_id', traceId)
    context.addMetadata('span_id', spanId)
    context.addMetadata('operation', operationName)

    // Add initial metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        context.addMetadata(key, value)
      })
    }

    try {
      const result = await fn(context)

      // Log span completion
      console.log(
        JSON.stringify({
          type: 'span',
          traceId,
          spanId,
          operationName,
          duration: Date.now() - startTime,
          status: 'OK',
          metadata: context.getMetadata(),
          service: this.config.serviceName,
        })
      )

      return result
    } catch (error) {
      console.error(
        JSON.stringify({
          type: 'span',
          traceId,
          spanId,
          operationName,
          duration: Date.now() - startTime,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: context.getMetadata(),
          service: this.config.serviceName,
        })
      )
      throw error
    } finally {
      this.currentTraceId = undefined
    }
  }

  addMetadata(key: string, value: string | number | boolean): void {
    // In edge runtime, we can't easily access active span context
    // This would require async-local-storage polyfill
    console.log(
      JSON.stringify({
        type: 'trace_metadata',
        key,
        value,
        traceId: this.currentTraceId,
      })
    )
  }

  getTraceId(): string | undefined {
    return this.currentTraceId
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Edge trace context for operation metadata
 * 
 * In the stub implementation, we store trace/span IDs for logging purposes only.
 * Future HTTP-based OTLP export will use these for proper correlation.
 */
class EdgeTraceContext implements TraceContext {
  private metadata: Record<string, string | number | boolean> = {}
  
  // Note: constructor parameters removed - stored in closure scope in EdgeTracing.trace()
  constructor() {}

  addMetadata(key: string, value: string | number | boolean): void {
    this.metadata[key] = value
  }

  recordError(error: Error): void {
    this.metadata['error'] = error.message
    this.metadata['error.name'] = error.name
    if (error.stack) {
      this.metadata['error.stack'] = error.stack
    }
  }

  setSuccess(): void {
    this.metadata['status'] = 'success'
  }

  setFailure(reason: string): void {
    this.metadata['status'] = 'failure'
    this.metadata['failure.reason'] = reason
  }

  getMetadata(): Record<string, string | number | boolean> {
    return { ...this.metadata }
  }
}
