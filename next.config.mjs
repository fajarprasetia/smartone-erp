/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
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
};

export default nextConfig;