import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:3001/api/auth/:path*',
      },
      {
        source: '/api/game/:path*',
        destination: 'http://localhost:3001/api/game/:path*',
      },
      {
        source: '/api/referral/:path*',
        destination: 'http://localhost:3001/api/referral/:path*',
      },
      {
        source: '/api/wallet/:path*',
        destination: 'http://localhost:3001/api/wallet/:path*',
      },
      {
        source: '/api/notifications',
        destination: 'http://localhost:3001/api/notifications',
      },
      {
        source: '/api/settings/:path*',
        destination: 'http://localhost:3001/api/settings/:path*',
      },
    ];
  },
};

export default nextConfig;
