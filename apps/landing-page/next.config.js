/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Configure for Cloudflare Pages deployment
  experimental: {
    runtime: 'edge',
  },
}

module.exports = nextConfig