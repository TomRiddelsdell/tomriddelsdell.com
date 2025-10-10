/**
 * Prometheus Metrics Endpoint
 * 
 * Exports metrics in Prometheus text format with distributed tracing support
 */

import { TraceContext, createSpan, createLogger } from '../lib/tracing'
import { Env } from '../index'

// In-memory metrics storage (simple implementation for demo)
const metrics = new Map<
  string,
  { value: number; type: string; help: string }
>()

/**
 * Initialize default metrics
 */
function initializeMetrics() {
  if (metrics.size === 0) {
    metrics.set('http_requests_total', {
      value: 0,
      type: 'counter',
      help: 'Total number of HTTP requests',
    })
    metrics.set('http_request_duration_seconds', {
      value: 0,
      type: 'histogram',
      help: 'HTTP request duration in seconds',
    })
    metrics.set('api_health_status', {
      value: 1,
      type: 'gauge',
      help: 'API health status (1 = healthy, 0 = unhealthy)',
    })
  }
}

/**
 * Format metrics in Prometheus exposition format
 */
function formatPrometheusMetrics(): string {
  initializeMetrics()

  const lines: string[] = []
  const timestamp = Date.now()

  for (const [name, data] of metrics.entries()) {
    lines.push(`# HELP ${name} ${data.help}`)
    lines.push(`# TYPE ${name} ${data.type}`)
    lines.push(`${name} ${data.value} ${timestamp}`)
    lines.push('')
  }

  return lines.join('\n')
}

export async function handleMetrics(
  request: Request,
  env: Env,
  traceContext: TraceContext
): Promise<Response> {
  const logger = createLogger(env.ENVIRONMENT || 'development')
  const span = createSpan('metrics-collection', traceContext)

  span.setAttribute('service.name', 'platform-api')
  span.setAttribute('endpoint', '/metrics')
  span.setAttribute('http.method', request.method)
  span.setAttribute('metrics.format', 'prometheus')

  try {
    logger.info('Metrics requested', {
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
      endpoint: '/metrics',
    })

    const metricsText = formatPrometheusMetrics()

    span.setAttribute('http.status_code', 200)
    span.setAttribute('metrics.lines_count', metricsText.split('\n').length)
    span.setAttribute(
      'metrics.size_bytes',
      new TextEncoder().encode(metricsText).length
    )
    span.end()

    return new Response(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    span.setAttribute('error', true)
    span.setAttribute(
      'error.message',
      error instanceof Error ? error.message : 'Unknown error'
    )
    span.end()

    logger.error('Metrics collection failed', {
      error: error instanceof Error ? error.message : String(error),
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
    })

    return new Response(
      JSON.stringify({
        error: 'Failed to generate metrics',
        correlationId: traceContext.correlationId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
