/**
 * PostCSS 构建配置
 *
 * 仅启用 Tailwind CSS 插件。CSS 的输出将在 next build 时
 * 被提取为静态 .css 文件，部署后在浏览器端加载，不涉及服务端渲染。
 */

/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
        tailwindcss: {}
    }
};

export default config;
