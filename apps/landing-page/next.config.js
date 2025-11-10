import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// CRITICAL: Initialize OpenNext Cloudflare adapter for development
// This is required for the adapter to work properly
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build configuration matching working examples
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // CRITICAL: OpenNext requires standalone output mode
  output: 'standalone',
  
  // Changed from 'export' to support API routes for observability
  // Cloudflare Pages supports Next.js API routes via Functions
  distDir: '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  
  // Experimental features (matching playground examples)
  experimental: {
    // Generate source maps for debugging (from playground examples)
    serverSourceMaps: true,
    
    // Turbopack configuration (Next.js 15 default)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
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
