/**
 * Lighthouse CI Configuration - Staging Environment
 *
 * Configures performance budgets and Core Web Vitals thresholds for staging deployment.
 * Tests against the actual Cloudflare Workers deployment.
 *
 * @see https://web.dev/vitals/
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

module.exports = {
  ci: {
    collect: {
      // Run against staging deployment
      url: [
        'https://landing-page-preview.t-riddelsdell.workers.dev',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Performance score threshold
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        interactive: ['warn', { maxNumericValue: 3800 }],

        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 204800 }], // 200KB
        'resource-summary:stylesheet:size': [
          'warn',
          { maxNumericValue: 51200 },
        ], // 50KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 512000 }], // 500KB
        'resource-summary:total:size': ['warn', { maxNumericValue: 1048576 }], // 1MB

        // Network requests
        'resource-summary:script:count': ['warn', { maxNumericValue: 10 }],
        'resource-summary:stylesheet:count': ['warn', { maxNumericValue: 3 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
