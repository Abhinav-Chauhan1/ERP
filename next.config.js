/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ["res.cloudinary.com", "img.clerk.com"],
    formats: ['image/avif', 'image/webp'],
  },

  // Enable Node.js runtime for middleware
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
