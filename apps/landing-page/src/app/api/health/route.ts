import { NextResponse } from 'next/server'
import { logger } from '@/lib/observability'
import { createSpan } from '@/lib/tracing'

/**
 * Health check endpoint with distributed tracing
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

// Configure for edge runtime with static export
export const runtime = 'edge'
export const dynamic = 'force-static'

export async function GET() {
  // Create trace context for this request
  const traceId = crypto.randomUUID()
  const correlationId = crypto.randomUUID()
  const startTime = Date.now()

  // Create span for health check operation
  const span = createSpan('health-check', {
    traceId,
    spanId: crypto.randomUUID(),
    correlationId,
    startTime,
  })
  span.setAttribute('service.name', 'landing-page')
  span.setAttribute('endpoint', '/api/health')

  try {
    // Structured logging with trace context
    logger.info('Health check requested', {
      correlationId,
      traceId,
      endpoint: '/api/health',
      method: 'GET',
    })

    // Perform health checks
    const applicationHealthy = true // Add actual health checks here
    span.setAttribute('health.application', applicationHealthy)

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'landing-page',
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      correlationId,
      traceId,
      checks: {
        application: applicationHealthy ? 'ok' : 'degraded',
        // Add more checks as needed (database, external services, etc.)
      },
      metrics: {
        responseTimeMs: Date.now() - startTime,
      },
    }

    span.setAttribute('http.status_code', 200)
    span.setAttribute('health.status', 'healthy')

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
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
      'Health check failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        correlationId,
        traceId,
      }
    )

    throw error
  } finally {
    span.end()
  }
}
