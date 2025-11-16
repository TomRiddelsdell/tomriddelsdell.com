/**
 * Prometheus metrics endpoint
 * Simplified version for Cloudflare Workers
 * Exposes application metrics in Prometheus text format for scraping
 */

import { NextResponse } from 'next/server'

// Use Node.js runtime (required for @opennextjs/cloudflare)
// Edge runtime is not supported - see https://opennext.js.org/cloudflare
export const runtime = 'nodejs'

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
  try {
    const metricsText = formatPrometheusMetrics()

    return new Response(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
