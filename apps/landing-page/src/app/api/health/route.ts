import { NextResponse } from 'next/server'
import {
  logger,
  tracing,
  generateCorrelationId,
} from '@/lib/observability-setup'

/**
 * Health check endpoint with distributed tracing
 *
 * Now using @platform/observability with CloudflareEdgeAdapter
 * to maintain consistent observability across the Platform Monolith.
 *
 * Returns comprehensive health information including:
 * - Service status
 * - Environment details
 * - Timestamp for cache-busting
 * - Trace context for debugging
 *
 * This endpoint is used by:
 * - GitHub Actions deployment verification
 * - External uptime monitors
 * - Cloudflare health checks
 * - Manual health verification
 */

// Use Node.js runtime (required for @opennextjs/cloudflare)
// Edge runtime is not supported - see https://opennext.js.org/cloudflare
export const runtime = 'nodejs'

export async function GET() {
  const correlationId = generateCorrelationId()
  const startTime = Date.now()

  // Start trace span for health check
  const span = tracing.startSpan('health.check')
  const spanContext = span.spanContext()

  try {
    logger.info('Health check requested', {
      correlationId,
      traceId: spanContext.traceId,
      timestamp: new Date().toISOString(),
    })

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'landing-page',
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      checks: {
        application: 'ok',
      },
      metrics: {
        responseTimeMs: Date.now() - startTime,
      },
      trace: {
        correlationId,
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      },
    }

    span.setAttribute('status', 'ok')
    span.setAttribute('responseTimeMs', health.metrics.responseTimeMs)
    span.end()

    logger.info('Health check completed', {
      correlationId,
      traceId: spanContext.traceId,
      status: 'healthy',
      responseTimeMs: health.metrics.responseTimeMs,
    })

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
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
    span.setAttribute('responseTimeMs', responseTimeMs)
    span.end()

    logger.error('Health check failed', error as Error, {
      correlationId,
      traceId: spanContext.traceId,
      responseTimeMs,
    })

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        trace: {
          correlationId,
          traceId: spanContext.traceId,
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          'X-Trace-ID': spanContext.traceId,
        },
      }
    )
  }
}
