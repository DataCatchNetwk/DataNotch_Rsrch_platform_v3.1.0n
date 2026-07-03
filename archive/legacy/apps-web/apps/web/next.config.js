/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress ISR manifest warning in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  
  // Enable experimental features for better dev experience
  experimental: {
    // Optimize production builds
    optimizeCss: true,
  },

  // Enable React strict mode for development
  reactStrictMode: true,

  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },

  // Headers for development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Webpack configuration to suppress warnings
  webpack: (config, { isServer }) => {
    // Suppress specific warnings
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: process.env.NODE_ENV === 'production',
      };
    }

    return config;
  },
};

module.exports = nextConfig;
