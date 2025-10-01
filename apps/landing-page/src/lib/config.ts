/**
 * Environment Configuration
 *
 * NODE_ENV - Controls build optimization (always 'production' for builds)
 * NEXT_PUBLIC_ENV - Controls runtime environment behavior
 */

export type Environment = 'development' | 'staging' | 'production'

export const config = {
  // Build-time environment (from NEXT_PUBLIC_ENV)
  env: (process.env.NEXT_PUBLIC_ENV as Environment) || 'production',

  // Build mode (NODE_ENV)
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Runtime configuration based on deployment environment
  api: {
    baseUrl: getApiBaseUrl(),
  },

  // Feature flags per environment
  features: {
    analytics: process.env.NEXT_PUBLIC_ENV === 'production',
    debugMode: process.env.NEXT_PUBLIC_ENV === 'development',
    staging: process.env.NEXT_PUBLIC_ENV === 'staging',
  },
} as const

function getApiBaseUrl(): string {
  switch (process.env.NEXT_PUBLIC_ENV) {
    case 'development':
      return 'https://dev-api.tomriddelsdell.com'
    case 'staging':
      return 'https://staging-api.tomriddelsdell.com'
    case 'production':
    default:
      return 'https://api.tomriddelsdell.com'
  }
}

export default config
