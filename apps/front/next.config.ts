import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bulaa/ui", "@bulaa/design", "@bulaa/shared", "@bulaa/db"],
};

export default nextConfig;
