/**
 * @fileoverview Forke Platform
 * @copyright (c) 2026 Forke Inc. (https://www.forke.space/)
 *
 * Source-Available License (Non-Commercial / Fair Source).
 * This source code is open for inspection, learning, and personal development.
 * Commercial use, hosting, or resale as a paid service without an explicit
 * commercial license from Forke Inc. is strictly prohibited.
 */

import type { NextConfig } from "next";

const r2Host = (() => {
  try {
    return process.env.CLOUDFLARE_R2_PUBLIC_URL ? new URL(process.env.CLOUDFLARE_R2_PUBLIC_URL).hostname : null
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Serve AVIF first (smaller than WebP), fall back to WebP.
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images on the CDN for a year so repeat views are free.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '**',
      },
      // uploaded avatars on R2, so the ID card painter can read them through /_next/image
      { protocol: 'https', hostname: '*.r2.dev', pathname: '**' },
      ...(r2Host ? [{ protocol: 'https' as const, hostname: r2Host, pathname: '**' }] : []),
    ],
  },
};

export default nextConfig;
