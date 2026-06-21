import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: true, // Disable to bypass webpack single-quote username path crash
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['sqlite3'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        readline: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};

export default withPWA(nextConfig);
