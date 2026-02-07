import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone", // Required for Docker deployment
  typescript: {
    // Skip TypeScript check during build (Bun crashes during this step)
    // TypeScript errors are still caught by IDE/linting
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
