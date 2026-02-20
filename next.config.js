/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/images/1.png', permanent: false },
    ]
  },
  async rewrites() {
    return [
      // Раздача загрузок через API из public/uploads (та же папка, куда пишет upload)
      { source: '/uploads/:path*', destination: '/api/uploads/:path*' },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [],
    unoptimized: true, // Отключена оптимизация для динамически загружаемых изображений
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Оптимизация сборки
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Временно, чтобы исправить проблему с изображениями
  },
}

module.exports = nextConfig
