import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['crypto', 'ws', '@0xgasless/agentkit'],
  },
  transpilePackages: ['langchain', '@langchain'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore WebSocket dependencies on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
        'utf-8-validate': false,
        bufferutil: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;