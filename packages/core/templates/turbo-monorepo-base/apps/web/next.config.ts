import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@__PROJECT_SCOPE__/ui"]
};

export default nextConfig;
