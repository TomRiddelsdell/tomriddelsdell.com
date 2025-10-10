/**
 * Distributed Tracing Utilities for Cloudflare Workers
 * 
 * Implements W3C Trace Context propagation and structured logging
 * compatible with OpenTelemetry standards.
 */

export interface TraceContext {
  traceId: string
  spanId: string
  correlationId: string
  startTime: number
}

/**
 * Generate a random hex string for trace/span IDs
 */
function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Extract trace context from incoming request
 * Parses W3C traceparent header format: 00-{traceId}-{spanId}-{flags}
 */
export function extractTraceContext(request: Request): TraceContext {
  const traceparent = request.headers.get('traceparent')
  const correlationId =
    request.headers.get('x-correlation-id') || randomHex(16)

  let traceId: string
  let spanId: string

  if (traceparent) {
    // Parse W3C traceparent: version-traceId-spanId-flags
    const parts = traceparent.split('-')
    if (parts.length === 4) {
      traceId = parts[1]
      spanId = parts[2]
    } else {
      traceId = randomHex(32)
      spanId = randomHex(16)
    }
  } else {
    // Generate new trace context
    traceId = randomHex(32)
    spanId = randomHex(16)
  }

  return {
    traceId,
    spanId,
    correlationId,
    startTime: Date.now(),
  }
}

/**
 * Inject trace headers into response
 */
export function injectTraceHeaders(
  response: Response,
  context: TraceContext
): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Correlation-Id', context.correlationId)
  headers.set('X-Trace-Id', context.traceId)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Structured logger with trace context
 */
export interface Logger {
  info(message: string, metadata?: Record<string, any>): void
  warn(message: string, metadata?: Record<string, any>): void
  error(message: string, metadata?: Record<string, any>): void
  debug(message: string, metadata?: Record<string, any>): void
}

export function createLogger(environment: string): Logger {
  const isProduction = environment === 'production'

  function log(
    level: string,
    message: string,
    metadata?: Record<string, any>
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment,
      ...metadata,
    }

    // In production, use JSON format for structured logging
    if (isProduction) {
      console.log(JSON.stringify(logEntry))
    } else {
      // In development, use readable format
      console.log(`[${level}] ${message}`, metadata || '')
    }
  }

  return {
    info: (message, metadata) => log('INFO', message, metadata),
    warn: (message, metadata) => log('WARN', message, metadata),
    error: (message, metadata) => log('ERROR', message, metadata),
    debug: (message, metadata) => log('DEBUG', message, metadata),
  }
}

/**
 * Simple span interface for manual instrumentation
 */
export interface SimpleSpan {
  name: string
  traceId: string
  spanId: string
  startTime: number
  attributes: Record<string, string | number | boolean>
  
  setAttribute(key: string, value: string | number | boolean): void
  end(): void
}

/**
 * Create a simple span for manual instrumentation
 * This is a lightweight implementation for Cloudflare Workers
 */
export function createSpan(
  name: string,
  context: TraceContext
): SimpleSpan {
  const span: SimpleSpan = {
    name,
    traceId: context.traceId,
    spanId: randomHex(16),
    startTime: Date.now(),
    attributes: {},

    setAttribute(key: string, value: string | number | boolean) {
      this.attributes[key] = value
    },

    end() {
      const duration = Date.now() - this.startTime
      console.log(
        JSON.stringify({
          span: this.name,
          traceId: this.traceId,
          spanId: this.spanId,
          duration,
          attributes: this.attributes,
        })
      )
    },
  }

  return span
}
