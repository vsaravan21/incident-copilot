import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["openai"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
