// next.config.mjs or next.config.js

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['thread-stream'],
};

export default nextConfig;
