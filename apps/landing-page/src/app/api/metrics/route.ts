/**
 * Prometheus metrics endpoint with distributed tracing
 *
 * Exposes application metrics in Prometheus text format for scraping
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/observability'
import { createSpan } from '@/lib/tracing'

// Configure for edge runtime
export const runtime = 'edge'
export const dynamic = 'force-static'

// Metrics storage (in-memory for demo)
const metrics = new Map<string, { value: number; type: string; help: string }>()

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
    metrics.set('landing_page_health_status', {
      value: 1,
      type: 'gauge',
      help: 'Landing page health status (1 = healthy, 0 = unhealthy)',
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

export async function GET() {
  // Create trace context for this request
  const traceId = crypto.randomUUID()
  const correlationId = crypto.randomUUID()
  const startTime = Date.now()

  // Create span for metrics collection
  const span = createSpan('metrics-collection', {
    traceId,
    spanId: crypto.randomUUID(),
    correlationId,
    startTime,
  })
  span.setAttribute('service.name', 'landing-page')
  span.setAttribute('endpoint', '/api/metrics')
  span.setAttribute('metrics.format', 'prometheus')

  try {
    logger.info('Metrics requested', {
      correlationId,
      traceId,
      endpoint: '/api/metrics',
      method: 'GET',
    })

    const metricsText = formatPrometheusMetrics()

    span.setAttribute('http.status_code', 200)
    span.setAttribute('metrics.lines_count', metricsText.split('\n').length)
    span.setAttribute(
      'metrics.size_bytes',
      Buffer.byteLength(metricsText, 'utf8')
    )

    return new Response(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Correlation-Id': correlationId,
        'X-Trace-Id': traceId,
      },
    })
  } catch (error) {
    span.setAttribute('error', true)
    span.setAttribute(
      'error.message',
      error instanceof Error ? error.message : 'Unknown error'
    )

    logger.error(
      'Metrics collection failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        correlationId,
        traceId,
      }
    )

    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    )
  } finally {
    span.end()
  }
}
