/** @type {import('next').NextConfig} */
const nextConfig = {
  // Changed from 'export' to support API routes for observability
  // Cloudflare Pages supports Next.js API routes via Functions
  distDir: '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Reduce bundle analysis overhead
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
