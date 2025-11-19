/**
 * Lighthouse CI Configuration
 * 
 * Configures performance budgets and Core Web Vitals thresholds for local testing.
 * 
 * Core Web Vitals Targets (Good):
 * - First Contentful Paint (FCP): < 1.8s
 * - Largest Contentful Paint (LCP): < 2.5s
 * - Cumulative Layout Shift (CLS): < 0.1
 * - Total Blocking Time (TBT): < 200ms
 * 
 * @see https://web.dev/vitals/
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 */

export default {
  ci: {
    collect: {
      // Run against local dev server
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        // Simulate mobile device (most restrictive)
        preset: 'desktop',
        // Throttling settings
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
        'interactive': ['warn', { maxNumericValue: 3800 }],

        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 204800 }], // 200KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 51200 }], // 50KB
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
};
