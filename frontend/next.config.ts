import type { NextConfig } from "next";

// API 目标地址：默认指向 docker-compose 中的后端服务名，
// 本地开发可通过环境变量 NEXT_PUBLIC_API_URL 覆盖（如 http://localhost:7070）
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://leleblog-api:7070';

const nextConfig: NextConfig = {
  // ⭐ 核心：API 转发
  async rewrites() {
    return [
      {
        // 匹配所有以 /api 开头的请求
        source: '/api/:path*',
        // 转发到后端服务地址（可通过环境变量配置）
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;