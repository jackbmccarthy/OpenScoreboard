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
  experimental: {
    outputFileTracingRoot: __dirname,
  },
}

module.exports = nextConfig
