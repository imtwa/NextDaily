/**
 * 根布局组件
 *
 * 定义整个站点的 HTML 骨架：语言声明、主题 Provider、Header/Footer 布局。
 * 所有子页面均嵌套在此布局内渲染。
 *
 * 静态导出说明:
 *   - 本文件在构建时执行一次，生成所有页面的共享 HTML 外壳
 *   - 最终输出为纯静态 HTML/CSS/JS，不包含任何服务端运行时
 *   - ThemeProvider 的暗色模式切换通过客户端 JS 实现，无需服务端
 */

import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import './globals.css';

/** 站点 SEO 元数据 */
export const metadata: Metadata = {
    title: '每日信息差 — AI 驱动的每日新闻简报',
    description: '自动搜集全球热点新闻，AI 过滤排序，每日更新。覆盖国内政策、国际局势、科技产业、金融市场、社会民生。'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col">
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </ThemeProvider>
            </body>
        </html>
    );
}
