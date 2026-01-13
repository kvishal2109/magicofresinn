import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "laxmisingla.catalog.to",
      },
      {
        protocol: "https",
        hostname: "laxmisingla.catalog.to",
      },
      {
        protocol: "http",
        hostname: "**.catalog.to",
      },
      {
        protocol: "https",
        hostname: "**.catalog.to",
      },
      {
        protocol: "https",
        hostname: "d19s00k70wfv0n.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "d1h96izmtdkx5o.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "cdn.quicksell.co",
      },
      {
        protocol: "https",
        hostname: "catalogue-cdn.quicksell.co",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
  // Note: Source map warnings in console are harmless and don't affect functionality
  // They're just Next.js dev tools trying to parse source maps
  // Turbopack (Next.js 16 default) doesn't support webpack configs
};

export default nextConfig;
