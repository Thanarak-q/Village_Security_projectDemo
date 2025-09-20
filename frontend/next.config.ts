import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'development' ? false : true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://backend:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
