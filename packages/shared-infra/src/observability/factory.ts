// packages/shared-infra/src/observability/factory.ts
/**
 * Factory for creating observability implementations
 * Auto-detects runtime and returns appropriate adapter
 */
import type { Observability, ObservabilityConfig } from './types'
import { NodeJSObservability } from './implementations/nodejs'
import { EdgeObservability } from './implementations/edge'

/**
 * Detect the current runtime environment
 * @returns 'nodejs' for Node.js runtime, 'edge' for V8 isolate runtimes
 */
export function detectRuntime(): 'nodejs' | 'edge' {
  // Check for Node.js-specific globals
  if (
    typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node
  ) {
    return 'nodejs'
  }

  // Default to edge runtime (Cloudflare Workers, Next.js Edge, etc.)
  return 'edge'
}

/**
 * Create observability instance for current runtime
 * 
 * Automatically detects runtime and returns appropriate implementation.
 * All vendor-specific code is hidden behind domain-friendly interfaces.
 * 
 * @param config - Observability configuration
 * @returns Observability instance for current runtime
 * 
 * @example
 * ```typescript
 * const observability = createObservability({
 *   serviceName: 'my-service',
 *   serviceVersion: '1.0.0',
 *   environment: 'production',
 *   otlp: {
 *     endpoint: 'https://otel-collector.example.com/v1/traces',
 *     headers: { 'x-api-key': 'secret' }
 *   }
 * })
 * 
 * // Use domain-friendly interface
 * await observability.tracing.trace('myOperation', async (ctx) => {
 *   ctx.addMetadata('userId', '123')
 *   // Business logic here
 *   ctx.setSuccess()
 * })
 * ```
 */
export function createObservability(
  config: ObservabilityConfig
): Observability {
  // Validate configuration
  validateConfig(config)

  // Use runtime hint if provided, otherwise auto-detect
  const runtime = config.runtime || detectRuntime()

  switch (runtime) {
    case 'nodejs':
      return new NodeJSObservability(config)
    case 'edge':
      return new EdgeObservability(config)
    default:
      throw new Error(`Unsupported runtime: ${runtime}`)
  }
}

/**
 * Validate observability configuration
 * Throws error if configuration is invalid
 */
function validateConfig(config: ObservabilityConfig): void {
  if (!config.serviceName || config.serviceName.trim().length === 0) {
    throw new Error('serviceName is required and cannot be empty')
  }

  if (!config.serviceVersion || config.serviceVersion.trim().length === 0) {
    throw new Error('serviceVersion is required and cannot be empty')
  }

  if (!['development', 'staging', 'production'].includes(config.environment)) {
    throw new Error(
      `environment must be one of: development, staging, production. Got: ${config.environment}`
    )
  }

  if (!config.otlp || !config.otlp.endpoint) {
    throw new Error('otlp.endpoint is required')
  }

  if (config.sampling && config.sampling.rate !== undefined) {
    const rate = config.sampling.rate
    if (typeof rate !== 'number' || rate < 0 || rate > 1) {
      throw new Error(
        `sampling.rate must be a number between 0 and 1. Got: ${rate}`
      )
    }
  }
}
