/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['smartone.id', 'erp.smartone.id'],
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
  webSocketTimeout: 30000,
}

module.exports = nextConfig
