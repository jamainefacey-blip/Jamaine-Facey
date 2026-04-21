/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'better-sqlite3',
        'pdf-parse',
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
