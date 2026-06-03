import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "remotion",
    "@remotion/media",
    "@remotion/player",
    "@remotion/web-renderer",
  ],
};

export default nextConfig;
