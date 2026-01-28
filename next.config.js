/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // TypeScript checking is now enabled
  typescript: {
    ignoreBuildErrors: false,
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
      // Allow images from subdomains
      {
        protocol: 'https',
        hostname: '*.sikshamitra.com',
      },
      {
        protocol: 'http',
        hostname: '*.localhost',
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

  // Custom headers for subdomain support
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Rewrites for subdomain handling
  async rewrites() {
    return {
      beforeFiles: [
        // Handle subdomain routing
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: '(?<subdomain>.*)\\.(?<domain>.*)',
            },
          ],
          destination: '/:path*',
        },
      ],
    };
  },
}

module.exports = nextConfig
