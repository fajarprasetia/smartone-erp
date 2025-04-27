/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['smartone.id', 'erp.smartone.id', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'smartone.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'erp.smartone.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Allow serving unoptimized images from local directory
  },
  // Disable file watching
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 1,
  },
  // Enable server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3100', '0.0.0.0:3100'],
      bodySizeLimit: '2mb',
    },
  },
  // Disable certain features to avoid permission issues
  webpack: (config) => {
    // Disable watching, which can cause permission issues on Windows
    config.watchOptions = {
      ignored: [
        '**/*',
        '**/node_modules/**',
        '**/Application Data/**',
        '**/Application*Data/**',
        'C:\\Users\\Win10\\Application Data/**'
      ],
      aggregateTimeout: 60 * 60 * 1000,
      poll: false,
    };
    config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    return config;
  },
  // Add static file serving configuration
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
      {
        source: '/tfuploads/:path*',
        destination: '/tfuploads/:path*',
      },
    ];
  },
}

module.exports = nextConfig
