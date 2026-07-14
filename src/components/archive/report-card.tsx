/**
 * 报告卡片组件
 *
 * 在归档列表中展示单篇报告的摘要信息，包含日期、主题标签和新闻条数。
 * 点击跳转到对应的报告详情页。
 */

import { Calendar, Hash } from 'lucide-react';
import type { ReportMeta } from '@/lib/types';

export default function ReportCard({ report }: { report: ReportMeta }) {
    /** 日期中的"日"部分，如 "14" */
    const day = report.date ? report.date.split('-').pop() : '?';
    /** 展示标签：有主题显示主题，无主题显示"热点新闻" */
    const label = report.topic || '热点新闻';

    return (
        <a
            href={`./report/${report.slug}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    {/* 日期徽章 */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-none">{day}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{label}</h3>
                        <p className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3 h-3" />
                            {report.date}
                        </p>
                    </div>
                </div>

                {/* 条数标签 */}
                <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Hash className="w-3 h-3" />
                    {report.itemCount}
                </div>
            </div>
        </a>
    );
}
