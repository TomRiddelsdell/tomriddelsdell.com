// packages/shared-infra/src/observability/implementations/nodejs.ts
/**
 * Node.js Implementation using OpenTelemetry
 *
 * This is the ONLY file that imports OpenTelemetry SDK.
 * Application code NEVER sees these imports.
 */
import { trace, Span, SpanStatusCode, Tracer } from '@opentelemetry/api'
import { Resource } from '@opentelemetry/resources'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import {
  NodeTracerProvider,
  BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'

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
 * OpenTelemetry implementation for Node.js runtime
 * Implements domain interface, hides vendor specifics
 */
export class NodeJSObservability implements Observability {
  private tracer: Tracer
  private logger: Logger
  private metricsCollector: Metrics
  private tracingManager: Tracing

  constructor(config: ObservabilityConfig) {
    this.initializeOpenTelemetry(config)
    this.tracer = trace.getTracer(config.serviceName, config.serviceVersion)
    this.logger = new NodeJSLogger(config)
    this.metricsCollector = new NodeJSMetrics(config)
    this.tracingManager = new NodeJSTracing(this.tracer)
  }

  private initializeOpenTelemetry(config: ObservabilityConfig): void {
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: config.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: config.serviceVersion,
      'deployment.environment': config.environment,
      'service.namespace': 'tomriddelsdell.com',
    })

    const exporter = new OTLPTraceExporter({
      url: config.otlp.endpoint,
      headers: config.otlp.headers,
    })

    const provider = new NodeTracerProvider({ resource })
    provider.addSpanProcessor(
      new BatchSpanProcessor(exporter, {
        maxQueueSize: 100,
        maxExportBatchSize: 10,
        scheduledDelayMillis: 500,
      })
    )

    provider.register()

    // Auto-instrument HTTP clients
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          ignoreUrls: [/\/health/, /\/metrics/],
          propagateTraceHeaderCorsUrls: [/.*/],
        }),
      ],
    })
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
 * Logger implementation using structured console logging
 * Automatically includes trace context when available
 */
class NodeJSLogger implements Logger {
  constructor(private config: ObservabilityConfig) {}

  private log(
    level: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const span = trace.getActiveSpan()
    const traceId = span?.spanContext().traceId
    const spanId = span?.spanContext().spanId

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.config.serviceName,
      environment: this.config.environment,
      message,
      ...(traceId && { traceId }),
      ...(spanId && { spanId }),
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
 * Metrics implementation using OpenTelemetry Meter API
 * Translates domain interface to vendor API
 */
class NodeJSMetrics implements Metrics {
  public readonly eventSourcing: EventSourcingMetrics

  constructor(private config: ObservabilityConfig) {
    this.eventSourcing = new NodeJSEventSourcingMetrics()
  }

  counter(name: string, value: number, labels?: Record<string, string>): void {
    // Stub implementation - full metrics require MeterProvider setup
    console.log(
      JSON.stringify({ type: 'counter', name, value, labels, service: this.config.serviceName })
    )
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    console.log(
      JSON.stringify({ type: 'gauge', name, value, labels, service: this.config.serviceName })
    )
  }

  histogram(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    console.log(
      JSON.stringify({ type: 'histogram', name, value, labels, service: this.config.serviceName })
    )
  }
}

/**
 * Event Sourcing metrics implementation
 * All 10+ specialized metrics for CQRS/Event Sourcing patterns
 */
class NodeJSEventSourcingMetrics implements EventSourcingMetrics {
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
 * Tracing implementation that wraps OpenTelemetry spans
 * Translates domain interface to vendor API
 */
class NodeJSTracing implements Tracing {
  constructor(private tracer: Tracer) {}

  async trace<T>(
    operationName: string,
    fn: (context: TraceContext) => Promise<T>,
    metadata?: Record<string, string | number | boolean>
  ): Promise<T> {
    return this.tracer.startActiveSpan(operationName, async (span: Span) => {
      try {
        // Wrap vendor span in domain-friendly context
        const context = new NodeJSTraceContext(span)

        // Add initial metadata if provided
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            context.addMetadata(key, value)
          })
        }

        const result = await fn(context)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        })
        span.recordException(error as Error)
        throw error
      } finally {
        span.end()
      }
    })
  }

  addMetadata(key: string, value: string | number | boolean): void {
    const span = trace.getActiveSpan()
    if (span) {
      span.setAttribute(key, value)
    }
  }

  getTraceId(): string | undefined {
    const span = trace.getActiveSpan()
    return span?.spanContext().traceId
  }
}

/**
 * Trace context that hides OpenTelemetry Span API
 * Provides domain-friendly interface
 */
class NodeJSTraceContext implements TraceContext {
  constructor(private span: Span) {}

  addMetadata(key: string, value: string | number | boolean): void {
    this.span.setAttribute(key, value)
  }

  recordError(error: Error): void {
    this.span.recordException(error)
  }

  setSuccess(): void {
    this.span.setStatus({ code: SpanStatusCode.OK })
  }

  setFailure(reason: string): void {
    this.span.setStatus({ code: SpanStatusCode.ERROR, message: reason })
  }
}
