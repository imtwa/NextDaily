/**
 * Next.js 构建配置
 *
 * 静态导出模式 (output: 'export'):
 *   构建产物为纯 HTML/CSS/JS 文件，无需 Node.js 服务端。
 *   生成的 out/ 目录可直接部署到 GitHub Pages、Nginx、CDN 等任意静态托管服务。
 *
 * basePath:
 *   GitHub Pages 项目站点需设置 basePath 为仓库名（如 /NextDaily）。
 *   用户站点（username.github.io）或自定义域名无需设置。
 *   通过 NEXT_PUBLIC_BASE_PATH 环境变量在 CI 中注入，本地开发默认为空。
 */

import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
    output: 'export',
    basePath,
    // 本地无 basePath 时用相对路径，file:// 协议也能加载 CSS/JS
    assetPrefix: basePath || '.',
    images: { unoptimized: true }
};

export default nextConfig;
