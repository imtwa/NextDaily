'use client';

/**
 * 归档侧边栏 — 右侧月份导航
 *
 * 列出所有月份及报告数量。点击筛选左侧列表，再次点击取消。
 */

import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import type { ReportMeta } from '@/lib/types';

interface Props {
    reports: ReportMeta[];
    selectedMonth: string | null;
    onSelectMonth: (month: string | null) => void;
}

export default function ArchiveSidebar({ reports, selectedMonth, onSelectMonth }: Props) {
    const months = useMemo(() => {
        const map = new Map<string, number>();
        for (const r of reports) {
            const parts = r.date.split('-');
            const key = parts.length >= 2 ? `${parts[0]}年${parseInt(parts[1])}月` : '未知';
            map.set(key, (map.get(key) || 0) + 1);
        }
        return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [reports]);

    const totalCount = reports.length;

    return (
        <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-20">
                {/* 标题 */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <CalendarDays className="w-4 h-4 text-red-800 dark:text-red-400" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 tracking-wide">
                        归档
                    </h3>
                </div>

                {/* 全部 */}
                <button
                    onClick={() => onSelectMonth(null)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors mb-1 ${
                        selectedMonth === null
                            ? 'bg-red-800 text-white dark:bg-red-700'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-paper-100 dark:hover:bg-paper-800/10'
                    }`}>
                    全部文章
                    <span className="float-right text-xs opacity-70">{totalCount}</span>
                </button>

                {/* 月份列表 */}
                <div className="mt-2 space-y-0.5">
                    {months.map(([month, count]) => {
                        const active = selectedMonth === month;
                        return (
                            <button
                                key={month}
                                onClick={() => onSelectMonth(active ? null : month)}
                                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                    active
                                        ? 'bg-red-800 text-white dark:bg-red-700'
                                        : 'text-gray-600 dark:text-slate-400 hover:bg-paper-100 dark:hover:bg-paper-800/10'
                                }`}>
                                <span className="truncate">{month}</span>
                                <span className="float-right text-xs opacity-70">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
