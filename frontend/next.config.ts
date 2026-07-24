import type { NextConfig } from "next";

// API 目标地址：默认指向 docker-compose 中的后端服务名，
// 本地开发可通过环境变量 NEXT_PUBLIC_API_URL 覆盖（如 http://localhost:7070）
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://leleblog-api:7070';

const nextConfig: NextConfig = {
  // ⭐ 核心：/api 转发 + /uploads 静态文件转发
  async rewrites() {
    return [
      {
        // API 请求转发到后端
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        // 用户上传的文件（图片、favicon 等）从后端 uploads 目录读取，
        // 避免在编辑器/前台出现跨域/404 问题，统一同源 :4000 提供
        source: '/uploads/:path*',
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;