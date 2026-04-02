/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'app.openscoreboard.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig
