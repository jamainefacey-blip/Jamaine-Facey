/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vst/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploads.voyagesmarttravel.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
};

module.exports = nextConfig;
