import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Enable if needed for server actions
  },
};

export default nextConfig;
