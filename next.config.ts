import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    clientRouterFilter: true,
  }
};

export default nextConfig;
