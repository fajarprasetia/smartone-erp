/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: ['smartone.id'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'smartone.id',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig; 