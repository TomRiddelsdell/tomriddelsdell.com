/**
 * Observability setup for landing page using @platform/observability-edge
 *
 * This implementation maintains consistent observability contracts across
 * the Platform Monolith (Landing Page, Identity, Notifications, Service Discovery)
 * while working within Next.js Edge Runtime constraints.
 *
 * **DDD Alignment**: The landing page is part of the Platform Monolith
 * bounded context (per CLAUDE.md architecture), not a separate domain.
 * All services in this bounded context share the same observability contracts.
 *
 * **Edge Runtime Compatibility**: Uses @platform/observability-edge which
 * provides the same interfaces as @platform/observability but without
 * Node.js dependencies (OpenTelemetry SDK, zlib, net, tls, etc.).
 *
 * **Bounded Context Consistency**: Despite using different packages for
 * different runtimes, the observability contract remains identical, ensuring
 * trace context propagation and consistent logging across the monolith.
 */

import { createEdgeObservability } from './observability-edge/index'
import type { PlatformObservability } from './observability-edge/types'

/**
 * Global observability instance for the landing page
 *
 * Uses @platform/observability-edge for Next.js Edge Runtime compatibility
 */
export const observability: PlatformObservability = createEdgeObservability({
  serviceName: 'platform-modular-monolith',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  platform: 'cloudflare',
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})

/**
 * Export components for convenient access
 */
export const logger = observability.log
export const metrics = observability.metrics
export const tracing = observability.tracing

/**
 * Helper to generate correlation IDs
 * Uses crypto.randomUUID if available (edge runtime), fallback to timestamp+random
 */
export const generateCorrelationId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
