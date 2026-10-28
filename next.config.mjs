/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double mounting in dev which causes duplicate WebSocket connection issues with Yjs awareness
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  env: {
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234",
  },
};

export default nextConfig;
