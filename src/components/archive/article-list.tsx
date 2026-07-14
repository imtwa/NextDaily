'use client';

/**
 * 文章列表 — 左侧主内容区
 *
 * 接收全部报告数据，根据 selectedMonth 筛选显示。
 */

import { useMemo } from 'react';
import type { ReportMeta } from '@/lib/types';
import ArticleItem from './article-item';

interface Props {
    reports: ReportMeta[];
    selectedMonth: string | null;
}

function groupByMonth(reports: ReportMeta[]): Map<string, ReportMeta[]> {
    const groups = new Map<string, ReportMeta[]>();
    for (const r of reports) {
        const parts = r.date.split('-');
        const key = parts.length >= 2 ? `${parts[0]}年${parseInt(parts[1])}月` : '未知';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
    }
    return groups;
}

export default function ArticleList({ reports, selectedMonth }: Props) {
    const grouped = useMemo(() => groupByMonth(reports), [reports]);

    const visibleMonths = useMemo(() => {
        if (!selectedMonth) return Array.from(grouped.keys());
        return grouped.has(selectedMonth) ? [selectedMonth] : [];
    }, [grouped, selectedMonth]);

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <p className="text-lg">暂无报告</p>
                <p className="text-sm mt-1">运行 npm run generate 生成第一份报告</p>
            </div>
        );
    }

    return (
        <div>
            {visibleMonths.map(month => (
                <section key={month}>
                    {/* 月份标识条 */}
                    <h2 className="px-4 py-2 text-xs font-semibold text-red-800/80 dark:text-red-400/80 bg-paper-100 dark:bg-paper-800/10 border-b border-paper-200 dark:border-paper-700/20 sticky top-14 z-10 tracking-wider">
                        {month}
                        <span className="ml-2 font-normal text-gray-500 dark:text-slate-400 normal-case">
                            {grouped.get(month)!.length} 篇
                        </span>
                    </h2>
                    {grouped.get(month)!.map(r => (
                        <ArticleItem key={r.slug} report={r} />
                    ))}
                </section>
            ))}
        </div>
    );
}
