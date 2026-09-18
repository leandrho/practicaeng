import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The content loaders read Markdown at runtime, so keep it in traced deploys.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*.md"],
  },
};

export default nextConfig;
