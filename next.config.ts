import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-f4be4446-e76b-4947-a712-a5417fb2fd30.space-z.ai",
    ".space-z.ai",
    "space-z.ai",
  ],
};

export default nextConfig;
