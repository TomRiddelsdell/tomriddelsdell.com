/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js before any other code.
 * It initializes the DDD-compliant observability system using @platform/shared-infra.
 *
 * The observability singleton is created in src/lib/observability.ts and handles
 * all OpenTelemetry SDK initialization internally. This file simply ensures the
 * observability module is loaded early in the application lifecycle.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see ADR-023 Observability Standards
 */

export async function register() {
  // Only initialize observability in Node.js runtime (not in Edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import observability singleton to trigger initialization
    // The createObservability() factory handles all OpenTelemetry SDK setup
    await import('./src/lib/observability')

    console.log('[Instrumentation] Observability initialized via ACL package')
  }
}
