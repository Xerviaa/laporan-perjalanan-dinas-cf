import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Ini wajib untuk mensimulasikan R2 di lokal (npm run dev)
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // TAMBAHKAN BARIS INI:
  serverExternalPackages: ["postgres", "jose"],
};

export default nextConfig;