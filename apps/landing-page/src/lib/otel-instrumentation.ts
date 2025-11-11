/**
 * Application Tracing Utilities
 *
 * DDD-compliant tracing utilities using domain-friendly observability interface.
 * All OpenTelemetry SDK complexity is hidden behind the observability edge adapter.
 *
 * Benefits of this approach:
 * - No vendor lock-in (can swap observability backend without code changes)
 * - Domain language (simplified span management)
 * - Easy to test (mock observability interface)
 * - Follows ADR-023 Observability Standards
 *
 * @example
 * ```ts
 * import { withSpan } from './lib/otel-instrumentation'
 *
 * const result = await withSpan('fetchUserData', async (span) => {
 *   span.setAttribute('user.id', userId)
 *   const data = await fetch('/api/user')
 *   return data
 * })
 * ```
 */

import { observability } from './observability'
import type { Span } from './observability-edge'

/**
 * Execute a function within a distributed trace span
 *
 * This is a convenience wrapper around observability.tracing.startSpan() that provides
 * a simpler API for common tracing scenarios.
 *
 * @param name - Operation name (e.g., 'fetchUserData', 'processPayment')
 * @param fn - Async function to execute within the span
 * @param attributes - Initial metadata to attach to the span
 * @returns Promise resolving to the function's return value
 *
 * @example
 * ```ts
 * const user = await withSpan('fetchUser', async (span) => {
 *   span.setAttribute('user.id', userId)
 *
 *   try {
 *     const response = await fetch(`/api/users/${userId}`)
 *     const data = await response.json()
 *
 *     span.setAttribute('user.role', data.role)
 *     return data
 *   } catch (error) {
 *     span.setAttribute('error', true)
 *     span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown')
 *     throw error
 *   }
 * }, { 'http.method': 'GET' })
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const span = observability.tracing.startSpan(name)

  // Add initial attributes
  if (attributes) {
    span.setAttributes(attributes)
  }

  try {
    const result = await fn(span)
    span.end()
    return result
  } catch (error) {
    span.setAttribute('error', true)
    span.setAttribute(
      'error.message',
      error instanceof Error ? error.message : 'Unknown error'
    )
    span.end()
    throw error
  }
}

/**
 * Get the current trace ID for correlation
 *
 * Useful for adding trace context to logs or error reports
 *
 * @returns Current trace ID or undefined if not in active span
 *
 * @example
 * ```ts
 * const traceId = getTraceId()
 * logger.info('Operation failed', { traceId, userId })
 * ```
 */
export function getTraceId(): string | undefined {
  // Create a trace context to get the current trace ID
  const trace = observability.tracing.createTrace()
  return trace.traceId
}

/**
 * Add metadata to a span
 *
 * This is a helper for adding attributes to spans in a consistent way.
 *
 * @param span - The span to add metadata to
 * @param key - Metadata key
 * @param value - Metadata value
 *
 * @example
 * ```ts
 * await withSpan('operation', async (span) => {
 *   addSpanMetadata(span, 'cache.hit', true)
 *   addSpanMetadata(span, 'db.query.duration_ms', 42)
 * })
 * ```
 */
export function addSpanMetadata(
  span: Span,
  key: string,
  value: string | number | boolean
): void {
  span.setAttribute(key, value)
}

/**
 * Legacy export for backward compatibility
 *
 * @deprecated Use withSpan() instead
 */
export const registerOpenTelemetry = () => {
  // No-op: Observability is now initialized automatically via instrumentation.ts
  console.log(
    '[otel-instrumentation] OpenTelemetry now initialized via edge adapter'
  )
}

/**
 * Legacy export for backward compatibility
 *
 * @deprecated Import observability.tracing directly from './observability'
 */
export const getTracer = () => {
  console.warn(
    '[otel-instrumentation] getTracer() is deprecated. Use observability.tracing instead'
  )
  return {
    startActiveSpan: (
      name: string,
      options: { attributes?: Record<string, string | number | boolean> },
      fn: (span: Span) => Promise<unknown>
    ) => {
      return withSpan(name, fn, options?.attributes)
    },
  }
}

