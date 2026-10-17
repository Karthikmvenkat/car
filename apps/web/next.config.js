/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.CARPAL_BUILD_DIR || '.next',
  // Static hosting needs export output; local development uses the Next server.
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
