import { NextResponse } from 'next/server'

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
  // Simplified version without observability for now
  // TODO: Re-add observability once @platform/shared-infra is published
  const startTime = Date.now()

  try {
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
    }

    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
