/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API路由配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;


