// packages/shared-infra/src/observability/types.ts
/**
 * Domain-Friendly Observability Interface
 *
 * This interface uses ubiquitous language from our domain,
 * not vendor-specific terminology.
 */
export interface Observability {
  /**
   * Structured logging with correlation
   */
  log: Logger

  /**
   * Business and technical metrics
   */
  metrics: Metrics

  /**
   * Distributed tracing across services
   */
  tracing: Tracing
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void
}

export interface Metrics {
  /**
   * Increment a counter (e.g., requests, events processed)
   */
  counter(name: string, value: number, labels?: Record<string, string>): void

  /**
   * Set a gauge value (e.g., queue depth, active connections)
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void

  /**
   * Record a histogram value (e.g., request duration, payload size)
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void

  /**
   * Event Sourcing-specific metrics for CQRS architectures
   */
  eventSourcing: EventSourcingMetrics
}

/**
 * Specialized metrics for Event Sourcing and CQRS patterns
 * Tracks aggregate health, projection performance, and event store operations
 */
export interface EventSourcingMetrics {
  /**
   * Track number of events appended to event store per commit
   * Helps identify large aggregates that may need refactoring
   *
   * @example
   * metrics.eventSourcing.eventsPerCommit(3, { aggregate_type: 'Project' })
   */
  eventsPerCommit(count: number, labels: { aggregate_type: string }): void

  /**
   * Track total aggregate size (event count)
   * Triggers snapshot recommendations when exceeds threshold
   *
   * @example
   * metrics.eventSourcing.aggregateSize(150, {
   *   aggregate_id: 'proj-123',
   *   aggregate_type: 'Project'
   * })
   */
  aggregateSize(
    eventCount: number,
    labels: { aggregate_id: string; aggregate_type: string }
  ): void

  /**
   * Track optimistic concurrency conflicts (version mismatches)
   * High rate indicates contention on specific aggregates
   *
   * @example
   * metrics.eventSourcing.concurrencyConflict({
   *   aggregate_id: 'proj-123',
   *   expected_version: 10,
   *   actual_version: 12
   * })
   */
  concurrencyConflict(labels: {
    aggregate_id: string
    expected_version: number
    actual_version: number
  }): void

  /**
   * Track projection lag (time between event timestamp and projection update)
   * Critical for monitoring eventual consistency SLAs
   *
   * @example
   * metrics.eventSourcing.projectionLag(2.5, {
   *   projection_name: 'UserProfile',
   *   event_type: 'UserRegistered'
   * })
   */
  projectionLag(
    seconds: number,
    labels: { projection_name: string; event_type: string }
  ): void

  /**
   * Track projection throughput (events processed per second)
   *
   * @example
   * metrics.eventSourcing.projectionThroughput(150, {
   *   projection_name: 'UserProfile'
   * })
   */
  projectionThroughput(
    eventsPerSecond: number,
    labels: { projection_name: string }
  ): void

  /**
   * Track projection errors and dead letter queue size
   *
   * @example
   * metrics.eventSourcing.projectionError({
   *   projection_name: 'UserProfile',
   *   error_type: 'DatabaseTimeout'
   * })
   */
  projectionError(labels: {
    projection_name: string
    error_type: string
  }): void

  /**
   * Track snapshot operations (creation and loading)
   *
   * @example
   * metrics.eventSourcing.snapshotOperation('created', {
   *   aggregate_type: 'Project',
   *   aggregate_version: 100,
   *   snapshot_size_bytes: 4096
   * })
   */
  snapshotOperation(
    operation: 'created' | 'loaded' | 'skipped',
    labels: {
      aggregate_type: string
      aggregate_version: number
      snapshot_size_bytes?: number
    }
  ): void

  /**
   * Track snapshot hit ratio (loaded from snapshot vs full replay)
   * High hit ratio indicates effective snapshot strategy
   *
   * @example
   * metrics.eventSourcing.snapshotHitRatio(0.85, {
   *   aggregate_type: 'Project'
   * })
   */
  snapshotHitRatio(ratio: number, labels: { aggregate_type: string }): void

  /**
   * Track event replay performance (events replayed after snapshot)
   *
   * @example
   * metrics.eventSourcing.eventsReplayed(15, {
   *   aggregate_id: 'proj-123',
   *   load_source: 'snapshot'
   * })
   */
  eventsReplayed(
    count: number,
    labels: {
      aggregate_id: string
      load_source: 'snapshot' | 'full_replay'
    }
  ): void

  /**
   * Track event store write latency
   *
   * @example
   * metrics.eventSourcing.eventStoreWriteLatency(45.2, {
   *   operation: 'append',
   *   events_count: 3
   * })
   */
  eventStoreWriteLatency(
    milliseconds: number,
    labels: {
      operation: 'append' | 'load' | 'snapshot'
      events_count?: number
    }
  ): void
}

export interface Tracing {
  /**
   * Trace an operation with automatic span management
   * Uses domain-friendly language, not vendor terminology
   *
   * @example
   * await tracing.trace('processUserRegistration', async (ctx) => {
   *   ctx.addMetadata('userId', user.id)
   *   await registerUser(user)
   * })
   */
  trace<T>(
    operationName: string,
    fn: (context: TraceContext) => Promise<T>,
    metadata?: Record<string, string | number | boolean>
  ): Promise<T>

  /**
   * Add metadata to current trace context
   */
  addMetadata(key: string, value: string | number | boolean): void

  /**
   * Get current trace ID for correlation
   */
  getTraceId(): string | undefined
}

export interface TraceContext {
  /**
   * Add operation-specific metadata
   * Domain-friendly: "addMetadata" not vendor-specific "span.setAttribute"
   */
  addMetadata(key: string, value: string | number | boolean): void

  /**
   * Record an error in current operation
   * Domain-friendly: "recordError" not vendor-specific "span.recordException"
   */
  recordError(error: Error): void

  /**
   * Mark operation as successful
   */
  setSuccess(): void

  /**
   * Mark operation as failed with reason
   */
  setFailure(reason: string): void
}

/**
 * Configuration for observability setup
 * Environment-driven, not hardcoded
 */
export interface ObservabilityConfig {
  serviceName: string
  serviceVersion: string
  environment: 'development' | 'staging' | 'production'

  // OTLP endpoint configuration (for all runtimes)
  otlp: {
    endpoint: string
    headers?: Record<string, string>
  }

  // Sampling configuration
  sampling?: {
    rate: number // 0.0 to 1.0
  }

  // Runtime hints (optional, auto-detected if not provided)
  runtime?: 'nodejs' | 'edge' | 'java' | 'python'
}
