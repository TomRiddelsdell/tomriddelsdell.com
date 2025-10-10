import { NextResponse } from 'next/server'
import { logger, generateCorrelationId } from '@/lib/observability'

/**
 * Health check endpoint
 *
 * Returns comprehensive health information including:
 * - Service status
 * - Environment details
 * - Timestamp for cache-busting
 *
 * This endpoint is used by:
 * - GitHub Actions deployment verification
 * - External uptime monitors
 * - Cloudflare health checks
 * - Manual health verification
 */

// Configure for static export
export const dynamic = 'force-static'
export const revalidate = 0

export async function GET() {
  const startTime = Date.now();
  const correlationId = generateCorrelationId();
  
  // Structured logging
  logger.info('Health check requested', {
    correlationId,
    endpoint: '/api/health',
    method: 'GET',
  });

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'landing-page',
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    correlationId,
    checks: {
      application: 'ok',
      // Add more checks as needed (database, external services, etc.)
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
      'X-Correlation-Id': correlationId,
    },
  })
}

export const runtime = 'edge'
