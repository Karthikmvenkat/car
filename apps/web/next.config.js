/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.CARPAL_BUILD_DIR || '.next',
  // Static hosting needs export output; local development uses the Next server.
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  // Static hosting applies the same alias in firebase.json, before file lookup.
  ...(process.env.NODE_ENV !== 'production' ? {
    async redirects() {
      return [{ source: '/vehicles/:slug', destination: '/configurator?vehicle=:slug', permanent: true }];
    },
  } : {}),
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
