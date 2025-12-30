import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

// CRITICAL: Initialize OpenNext Cloudflare adapter for development
// This is required for the adapter to work properly
initOpenNextCloudflareForDev()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build configuration
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // CRITICAL: Empty turbopack config to acknowledge webpack is intentional
  // Next.js 16 defaults to Turbopack, but we use webpack due to workspace compatibility
  // The build command will use --webpack flag to force webpack
  turbopack: {},

  // CRITICAL: OpenNext requires standalone output mode
  output: 'standalone',

  // Changed from 'export' to support API routes for observability
  // Cloudflare Pages supports Next.js API routes via Functions
  distDir: '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  // Experimental features
  experimental: {
    // Generate source maps for debugging (from playground examples)
    serverSourceMaps: true,
  },

  // Webpack fallback for production builds
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize for production builds
      config.optimization.splitChunks.cacheGroups = {
        default: false,
        vendors: false,
        framework: {
          chunks: 'all',
          name: 'framework',
          test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
          priority: 40,
          enforce: true,
        },
      }
    }
    return config
  },
}

export default nextConfig
