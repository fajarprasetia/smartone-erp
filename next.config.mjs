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
    ],
  },
  distDir: 'build',
  // Skip system directories during build
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Handle permissions errors
  webpack: (config) => {
    config.watchOptions = {
      aggregateTimeout: 300,
      poll: 1000,
      ignored: ['**/node_modules', '**/.git', '**/Application Data', '**/AppData'],
    };
    return config;
  },
};

export default nextConfig;