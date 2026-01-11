/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Temporarily disable TypeScript checking during build for migration testing
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 14400, // 4 hours
  },

  // Server actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
