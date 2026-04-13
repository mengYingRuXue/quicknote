import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quicknote/ui", "@quicknote/shared"],
};

export default nextConfig;
