/**
 * Health Check Endpoint
 * 
 * Returns comprehensive health information with distributed tracing support
 */

import { TraceContext, createSpan, createLogger } from '../lib/tracing'
import { Env } from '../index'

export async function handleHealth(
  request: Request,
  env: Env,
  traceContext: TraceContext
): Promise<Response> {
  const logger = createLogger(env.ENVIRONMENT || 'development')
  const span = createSpan('health-check', traceContext)

  span.setAttribute('service.name', 'platform-api')
  span.setAttribute('endpoint', '/health')
  span.setAttribute('http.method', request.method)

  try {
    // Log health check request
    logger.info('Health check requested', {
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
      endpoint: '/health',
    })

    // Perform health checks
    const applicationHealthy = true // Add actual health checks here
    span.setAttribute('health.application', applicationHealthy)

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'platform-api',
      environment: env.ENVIRONMENT || 'development',
      version: '1.0.0',
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
      checks: {
        application: applicationHealthy ? 'ok' : 'degraded',
        // Add more checks as needed (database, external services, etc.)
      },
      metrics: {
        responseTimeMs: Date.now() - traceContext.startTime,
      },
    }

    span.setAttribute('http.status_code', 200)
    span.setAttribute('health.status', 'healthy')
    span.end()

    return new Response(JSON.stringify(health, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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

    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
    })

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: traceContext.correlationId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
