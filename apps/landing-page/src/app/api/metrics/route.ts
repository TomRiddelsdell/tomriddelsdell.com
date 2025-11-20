/**
 * Prometheus metrics endpoint
 * Exposes application metrics in Prometheus text format for scraping
 * Integrated with @platform/observability for consistent metrics collection
 */

import { NextResponse } from 'next/server'
import {
  logger,
  metrics,
  tracing,
  generateCorrelationId,
} from '@/lib/observability-setup'

// Use Node.js runtime (required for @opennextjs/cloudflare)
// Edge runtime is not supported - see https://opennext.js.org/cloudflare
export const runtime = 'nodejs'

// Metrics storage (in-memory for demo)
const metricsStore = new Map<
  string,
  { value: number; type: string; help: string }
>()

/**
 * Initialize default metrics
 */
function initializeMetrics() {
  if (metricsStore.size === 0) {
    metricsStore.set('http_requests_total', {
      value: 0,
      type: 'counter',
      help: 'Total number of HTTP requests',
    })
    metricsStore.set('http_request_duration_seconds', {
      value: 0,
      type: 'histogram',
      help: 'HTTP request duration in seconds',
    })
    metricsStore.set('landing_page_health_status', {
      value: 1,
      type: 'gauge',
      help: 'Landing page health status (1 = healthy, 0 = unhealthy)',
    })
  }

  // Update counters
  const currentCount = metricsStore.get('http_requests_total')?.value || 0
  metricsStore.set('http_requests_total', {
    value: currentCount + 1,
    type: 'counter',
    help: 'Total number of HTTP requests',
  })
}

/**
 * Format metrics in Prometheus exposition format
 */
function formatPrometheusMetrics(): string {
  initializeMetrics()

  const lines: string[] = []
  const timestamp = Date.now()

  for (const [name, data] of metricsStore.entries()) {
    lines.push(`# HELP ${name} ${data.help}`)
    lines.push(`# TYPE ${name} ${data.type}`)
    lines.push(`${name} ${data.value} ${timestamp}`)
    lines.push('')
  }

  return lines.join('\n')
}

export async function GET() {
  const correlationId = generateCorrelationId()
  const startTime = Date.now()

  // Start trace span
  const span = tracing.startSpan('metrics.export')
  const spanContext = span.spanContext()

  try {
    logger.info('Metrics export requested', {
      correlationId,
      traceId: spanContext.traceId,
    })

    const metricsText = formatPrometheusMetrics()
    const responseTimeMs = Date.now() - startTime

    // Record metrics via observability
    metrics.histogram.observe('http.request.duration', responseTimeMs, {
      service: 'landing-page',
      endpoint: '/api/metrics',
    })

    metrics.counter.inc('http.requests.total', 1, {
      service: 'landing-page',
      endpoint: '/api/metrics',
      status: '200',
    })

    span.setAttribute('status', 'ok')
    span.setAttribute('responseTimeMs', responseTimeMs)
    span.setAttribute('metricsCount', metricsStore.size)
    span.end()

    logger.info('Metrics export completed', {
      correlationId,
      traceId: spanContext.traceId,
      metricsCount: metricsStore.size,
      responseTimeMs,
    })

    return new Response(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'X-Correlation-ID': correlationId,
        'X-Trace-ID': spanContext.traceId,
      },
    })
  } catch (error) {
    const responseTimeMs = Date.now() - startTime

    span.setAttribute('status', 'error')
    span.setAttribute('error', true)
    span.setAttribute(
      'error.message',
      error instanceof Error ? error.message : 'Unknown error'
    )
    span.end()

    logger.error('Metrics export failed', error as Error, {
      correlationId,
      traceId: spanContext.traceId,
      responseTimeMs,
    })

    metrics.counter.inc('http.requests.total', 1, {
      service: 'landing-page',
      endpoint: '/api/metrics',
      status: '500',
    })

    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
