/**
 * Trace context middleware for Next.js API routes
 *
 * Automatically creates spans for API requests and propagates trace context
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger, generateCorrelationId } from './observability'

export interface TraceContext {
  traceId?: string
  spanId?: string
  correlationId: string
  startTime: number
}

/**
 * Extract trace context from request headers (W3C Trace Context)
 */
export function extractTraceContext(request: NextRequest): TraceContext {
  const traceparent = request.headers.get('traceparent')
  const correlationId =
    request.headers.get('x-correlation-id') || generateCorrelationId()

  let traceId: string | undefined
  let spanId: string | undefined

  if (traceparent) {
    // Parse W3C traceparent header: version-traceId-spanId-flags
    // Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
    const parts = traceparent.split('-')
    if (parts.length === 4) {
      traceId = parts[1]
      spanId = parts[2]
    }
  }

  return {
    traceId,
    spanId,
    correlationId,
    startTime: Date.now(),
  }
}

/**
 * Inject trace headers into HTTP response
 * Adds X-Correlation-Id and X-Trace-Id headers for trace context propagation
 *
 * @param response - NextResponse or Response object
 * @param context - Trace context to inject
 * @returns Response with trace headers
 */
export function injectTraceHeaders(
  response: NextResponse | Response,
  context: TraceContext
): Response {
  // Clone the response to add headers
  const headers = new Headers(response.headers)
  headers.set('X-Correlation-Id', context.correlationId)

  // Only set trace ID if present
  if (context.traceId) {
    headers.set('X-Trace-Id', context.traceId)
  }

  // Create new response with trace headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Log API request with trace context
 */
export function logApiRequest(
  request: NextRequest,
  context: TraceContext,
  status: number,
  metadata?: Record<string, unknown>
): void {
  const duration = Date.now() - context.startTime

  logger.info('API request completed', {
    correlationId: context.correlationId,
    traceId: context.traceId,
    spanId: context.spanId,
    method: request.method,
    url: request.url,
    status,
    duration,
    ...metadata,
  })
}

/**
 * Log API error with trace context
 */
export function logApiError(
  request: NextRequest,
  context: TraceContext,
  error: Error,
  metadata?: Record<string, unknown>
): void {
  const duration = Date.now() - context.startTime

  logger.error('API request failed', error, {
    correlationId: context.correlationId,
    traceId: context.traceId,
    spanId: context.spanId,
    method: request.method,
    url: request.url,
    duration,
    ...metadata,
  })
}

/**
 * Create a span for an operation (simplified for Edge runtime)
 */
export interface SimpleSpan {
  name: string
  startTime: number
  attributes: Record<string, string | number | boolean>

  setAttribute(key: string, value: string | number | boolean): void
  end(): void
}

export function createSpan(name: string, context: TraceContext): SimpleSpan {
  const span: SimpleSpan = {
    name,
    startTime: Date.now(),
    attributes: {
      'correlation.id': context.correlationId,
    },

    setAttribute(key: string, value: string | number | boolean) {
      this.attributes[key] = value
    },

    end() {
      const duration = Date.now() - this.startTime

      logger.debug('Span completed', {
        correlationId: context.correlationId,
        traceId: context.traceId,
        spanId: context.spanId,
        span: {
          name: this.name,
          duration,
          attributes: this.attributes,
        },
      })
    },
  }

  if (context.traceId) {
    span.attributes['trace.id'] = context.traceId
  }

  return span
}
