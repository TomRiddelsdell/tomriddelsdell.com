/**
 * Observability singleton for landing page
 *
 * Provides unified observability interface using edge-compatible implementation.
 * When @platform/shared-infra is published, this will be updated to use that package.
 *
 * Current implementation: Uses inlined observability-edge adapter
 * Future implementation: Will import from @platform/shared-infra
 */

import { createEdgeObservability } from './observability-edge'
import type { PlatformObservability } from './observability-edge'

/**
 * Create and export observability singleton
 *
 * This provides the same interface that will be used when we migrate to
 * @platform/shared-infra, making the transition seamless.
 */
export const observability: PlatformObservability = createEdgeObservability({
  serviceName: 'landing-page',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.NEXT_PUBLIC_ENV || 'development',
  platform: 'edge' as const,
})

/**
 * Legacy exports for backward compatibility
 */
export const logger = observability.log

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
