import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${API_URL}/api/auth/:path*`,
      },
      {
        source: '/api/game/:path*',
        destination: `${API_URL}/api/game/:path*`,
      },
      {
        source: '/api/referral/:path*',
        destination: `${API_URL}/api/referral/:path*`,
      },
      {
        source: '/api/wallet/:path*',
        destination: `${API_URL}/api/wallet/:path*`,
      },
      {
        source: '/api/notifications',
        destination: `${API_URL}/api/notifications`,
      },
      {
        source: '/api/settings/:path*',
        destination: `${API_URL}/api/settings/:path*`,
      },
    ];
  },
};

export default nextConfig;
