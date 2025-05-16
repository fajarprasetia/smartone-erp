/** @type {import('next').NextConfig} */
const nextConfig = {
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
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:9000'],
      bodySizeLimit: '2mb',
    },
  },
  // Moved from experimental to root level as per warning
  serverExternalPackages: [],
  
  // Headers configuration to increase limits
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive'
          }
        ],
      },
    ]
  },
  // Improve development experience
  webpack: (config, { dev, isServer }) => {
    // Only configure logging without changing devtool
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
  poweredByHeader: false,
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig;