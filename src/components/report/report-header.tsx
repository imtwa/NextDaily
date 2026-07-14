/**
 * 报告头部组件
 *
 * 展示报告标题、日期和新闻条数。
 * 编辑风格排版 — 干净、去 AI 味。
 */

import type { ReportMeta } from '@/lib/types';

export default function ReportHeader({ meta }: { meta: ReportMeta }) {
    return (
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {meta.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                <span>{meta.date}</span>
                {meta.topic && (
                    <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span>{meta.topic}</span>
                    </>
                )}
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span>{meta.itemCount} 条新闻</span>
            </div>
        </div>
    );
}
