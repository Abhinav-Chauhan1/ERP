/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
    ],
    
    // Enable optimized CSS
    optimizeCss: true,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate chunk for large libraries
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              priority: 30,
            },
            radix: {
              name: 'radix',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 30,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Font optimization is enabled by default in Next.js
  // next/font/google automatically:
  // - Self-hosts fonts (no external requests)
  // - Applies font-display: swap when configured
  // - Optimizes font loading with preloading
  // - Prevents layout shift with font metrics
  
  images: {
    // Cloudinary domain for image hosting
    domains: ["res.cloudinary.com"],
    
    // Modern image formats for better compression and quality
    // WebP: ~30% smaller than JPEG, AVIF: ~50% smaller than JPEG
    formats: ['image/avif', 'image/webp'],
    
    // Device sizes for responsive images (in pixels)
    // These correspond to common device breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different layout widths (in pixels)
    // Used when images don't span full viewport width
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimize layout shift by enforcing size attributes
    minimumCacheTTL: 60, // Cache optimized images for 60 seconds minimum
    
    // Cloudinary-specific optimization via loader
    loader: 'default', // Use Next.js default loader with Cloudinary domains
    
    // Disable static image imports optimization if needed
    // disableStaticImages: false,
    
    // Allowed image optimization quality (1-100)
    // Lower = smaller file size, higher = better quality
    // Default is 75 which provides good balance
    // dangerouslyAllowSVG: true, // Enable if SVG support needed
    // contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
