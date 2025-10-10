/**
 * Cloudflare Workers API
 * 
 * Provides health checks, metrics, and observability endpoints
 * with full distributed tracing support following ADR-002 architecture.
 */

import { handleHealth } from './handlers/health'
import { handleMetrics } from './handlers/metrics'
import { extractTraceContext, injectTraceHeaders, createLogger } from './lib/tracing'

export interface Env {
  ENVIRONMENT?: string
  JAEGER_ENDPOINT?: string
  JAEGER_AUTH_TOKEN?: string
}

/**
 * Main request handler with trace context propagation
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const logger = createLogger(env.ENVIRONMENT || 'development')

    // Extract trace context from incoming request
    const traceContext = extractTraceContext(request)
    
    // Log incoming request
    logger.info('Request received', {
      method: request.method,
      path: url.pathname,
      correlationId: traceContext.correlationId,
      traceId: traceContext.traceId,
    })

    try {
      let response: Response

      // Route to appropriate handler
      switch (url.pathname) {
        case '/health':
          response = await handleHealth(request, env, traceContext)
          break

        case '/metrics':
          response = await handleMetrics(request, env, traceContext)
          break

        default:
          response = new Response(
            JSON.stringify({
              error: 'Not Found',
              path: url.pathname,
              availableEndpoints: ['/health', '/metrics'],
            }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }
          )
      }

      // Inject trace headers into response
      return injectTraceHeaders(response, traceContext)
    } catch (error) {
      logger.error('Request failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        correlationId: traceContext.correlationId,
        traceId: traceContext.traceId,
      })

      const errorResponse = new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          correlationId: traceContext.correlationId,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )

      return injectTraceHeaders(errorResponse, traceContext)
    }
  },
}
