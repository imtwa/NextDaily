/**
 * Tailwind CSS 构建配置
 *
 * 扫描 src/ 目录下的所有 TSX 文件生成原子 CSS。
 * 暗色模式使用 class 策略（由 next-themes 驱动）。
 * 集成 @tailwindcss/typography 插件用于 Markdown 正文渲染。
 */

import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif']
            },
            colors: {
                paper: {
                    '50': '#FBFAF7',
                    '100': '#F6F4EF',
                    '200': '#E8E3D5',
                    '300': '#D4CFC1',
                    '400': '#A09888',
                    '500': '#8B8270',
                    '600': '#6E6656',
                    '700': '#5C5445',
                    '800': '#3D362A',
                    '900': '#1F1B15'
                }
            }
        }
    },
    plugins: [require('@tailwindcss/typography')]
};

export default config;
