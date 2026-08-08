import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Hide Next.js floating dev indicator (bottom-left rounded button)
  devIndicators: false,
};

export default nextConfig;
