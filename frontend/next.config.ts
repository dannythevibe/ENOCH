import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: true, // Disable to bypass webpack single-quote username path crash
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);
