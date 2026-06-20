import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  disable: true, // Disable to bypass webpack single-quote username path crash
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
