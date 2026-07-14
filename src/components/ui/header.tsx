'use client';

/**
 * 站点顶部导航栏
 *
 * 包含站点标题（可点击返回首页）和暗色模式切换按钮。
 * 使用 next-themes 实现系统主题跟随和手动切换。
 * 顶部粘性定位，滚动时带毛玻璃背景效果。
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // SSR 阶段输出占位符，避免 hydration mismatch
    if (!mounted) {
        return (
            <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
                    <span className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-wide">每日信息差</span>
                    <div className="w-9 h-9" />
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
                <a
                    href="./"
                    className="text-lg font-bold text-gray-900 dark:text-slate-100 hover:text-red-700 dark:hover:text-red-400 transition-colors tracking-wide">
                    每日信息差
                </a>

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="切换暗色模式">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </header>
    );
}
