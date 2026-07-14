'use client';

/**
 * 搜索词库展示组件
 *
 * 以可折叠面板形式展示 Stage 1 生成的搜索关键词矩阵。
 * 每组关键词显示为独立的圆角卡片，带编号和分隔符。
 * 默认展开，点击标题可折叠。
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function KeywordMatrix({ keywords }: { keywords: string[][] }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="mb-8">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-left group mb-3">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors" />
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                    搜索词库
                    <span className="ml-1.5 font-normal text-slate-400 dark:text-slate-500">
                        {keywords.length} 组
                    </span>
                </h2>
                {open ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
            </button>

            {open && (
                <div className="flex flex-wrap gap-1.5">
                    {keywords.map((group, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-paper-100 dark:bg-paper-800/10 border border-paper-200 dark:border-paper-700/20 text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium text-red-700 dark:text-red-400">#{i + 1}</span>
                            {group.join(' · ')}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
