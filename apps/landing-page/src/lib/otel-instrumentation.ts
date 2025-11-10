/**
 * Application Tracing Utilities
 *
 * DDD-compliant tracing utilities using domain-friendly observability interface.
 * All OpenTelemetry SDK complexity is hidden behind @platform/shared-infra ACL.
 *
 * Benefits of this approach:
 * - No vendor lock-in (can swap observability backend without code changes)
 * - Domain language (trace, addMetadata vs span.setAttribute)
 * - Easy to test (mock observability interface)
 * - Follows ADR-023 Observability Standards
 *
 * @example
 * ```ts
 * import { withSpan } from './lib/otel-instrumentation'
 *
 * const result = await withSpan('fetchUserData', async (context) => {
 *   context.addMetadata('user.id', userId)
 *   const data = await fetch('/api/user')
 *   context.setSuccess()
 *   return data
 * })
 * ```
 */

import { observability } from './observability'
import type { TraceContext } from '@platform/shared-infra'

/**
 * Execute a function within a distributed trace span
 *
 * This is a convenience wrapper around observability.tracing.trace() that provides
 * a simpler API for common tracing scenarios.
 *
 * @param name - Operation name (e.g., 'fetchUserData', 'processPayment')
 * @param fn - Async function to execute within the span
 * @param attributes - Initial metadata to attach to the span
 * @returns Promise resolving to the function's return value
 *
 * @example
 * ```ts
 * const user = await withSpan('fetchUser', async (context) => {
 *   context.addMetadata('user.id', userId)
 *
 *   try {
 *     const response = await fetch(`/api/users/${userId}`)
 *     const data = await response.json()
 *
 *     context.addMetadata('user.role', data.role)
 *     context.setSuccess()
 *
 *     return data
 *   } catch (error) {
 *     context.recordError(error as Error)
 *     context.setFailure(error instanceof Error ? error.message : 'Unknown error')
 *     throw error
 *   }
 * }, { 'http.method': 'GET' })
 * ```
 */
export async function withSpan<T>(
  name: string,
  fn: (context: TraceContext) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return observability.tracing.trace(name, async (context) => {
    // Add initial attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        context.addMetadata(key, value)
      })
    }

    try {
      const result = await fn(context)
      context.setSuccess()
      return result
    } catch (error) {
      context.recordError(error as Error)
      context.setFailure(
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  })
}

/**
 * Get the current trace ID for correlation
 *
 * Useful for adding trace context to logs or error reports
 *
 * @returns Current trace ID or undefined if not in active trace
 *
 * @example
 * ```ts
 * const traceId = getTraceId()
 * logger.error('Operation failed', { traceId, userId })
 * ```
 */
export function getTraceId(): string | undefined {
  return observability.tracing.getTraceId()
}

/**
 * Add metadata to the current active span
 *
 * This is useful when you need to add context to an existing span
 * without creating a new nested span.
 *
 * @param key - Metadata key
 * @param value - Metadata value
 *
 * @example
 * ```ts
 * addSpanMetadata('cache.hit', true)
 * addSpanMetadata('db.query.duration_ms', 42)
 * ```
 */
export function addSpanMetadata(
  key: string,
  value: string | number | boolean
): void {
  observability.tracing.addMetadata(key, value)
}

/**
 * Legacy export for backward compatibility
 *
 * @deprecated Use withSpan() instead
 */
export const registerOpenTelemetry = () => {
  // No-op: Observability is now initialized automatically via instrumentation.ts
  console.log(
    '[otel-instrumentation] OpenTelemetry now initialized via ACL package'
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
      fn: (context: TraceContext) => Promise<unknown>
    ) => {
      return withSpan(name, fn, options?.attributes)
    },
  }
}
