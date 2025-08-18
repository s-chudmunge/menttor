/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/wikipedia/commons/thumb/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/register',
        destination: '/api/auth/register',
      },
      {
        source: '/api/auth/login',
        destination: '/api/auth/login',
      },
      {
        source: '/api/auth/validate_token',
        destination: '/api/auth/validate_token',
      },
    ];
  },
};

module.exports = nextConfig;
