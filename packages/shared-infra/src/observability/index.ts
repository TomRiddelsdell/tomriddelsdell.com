// packages/shared-infra/src/observability/index.ts
/**
 * @platform/shared-infra/observability
 * 
 * DDD-compliant Anti-Corruption Layer for OpenTelemetry
 * Provides domain-friendly interfaces hiding vendor-specific APIs
 * 
 * @packageDocumentation
 */

// Export all domain-friendly interfaces
export type {
  Observability,
  Logger,
  Metrics,
  EventSourcingMetrics,
  Tracing,
  TraceContext,
  ObservabilityConfig,
} from './types'

// Export factory function (primary API)
export { createObservability, detectRuntime } from './factory'

// DO NOT export implementation classes (NodeJSObservability, EdgeObservability)
// Consumers should only use createObservability() factory
// This enforces the Anti-Corruption Layer pattern

/**
 * Usage Example:
 * 
 * ```typescript
 * import { createObservability } from '@platform/shared-infra/observability'
 * 
 * const observability = createObservability({
 *   serviceName: 'accounts-service',
 *   serviceVersion: '1.0.0',
 *   environment: 'production',
 *   otlp: {
 *     endpoint: 'https://otel-collector.example.com/v1/traces',
 *     headers: { 'x-api-key': process.env.OTEL_API_KEY }
 *   },
 *   sampling: {
 *     rate: 0.1  // 10% sampling
 *   }
 * })
 * 
 * // Structured logging with trace context
 * observability.log.info('User logged in', { userId: '123', method: 'oauth' })
 * 
 * // Event Sourcing metrics
 * observability.metrics.eventSourcing.eventsPerCommit(
 *   'Account',
 *   5,
 *   { tenantId: 'tenant-123' }
 * )
 * 
 * // Distributed tracing
 * await observability.tracing.trace('ProcessOrder', async (ctx) => {
 *   ctx.addMetadata('orderId', '456')
 *   // Business logic here
 *   ctx.setSuccess()
 * })
 * ```
 */
