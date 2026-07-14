/**
 * 文章列表项 — 新闻报刊风格
 *
 * 展示单篇报告的摘要行：暗红日期标签 + 标题 + 摘要。
 * 点击在新标签页打开完整报告。
 */

import type { ReportMeta } from '@/lib/types';

/** 从日期字符串中提取月日，如 "2026-07-14" → "7月14日" */
function formatDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    return `${m}月${d}日`;
}

export default function ArticleItem({ report }: { report: ReportMeta }) {
    const label = report.topic || '热点新闻';

    return (
        <a
            href={`./report/${report.slug}.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block px-4 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-paper-100 dark:hover:bg-paper-800/10 transition-colors">
            <div className="flex items-start gap-4">
                {/* 日期 — 暗红字 */}
                <time className="flex-shrink-0 mt-0.5 text-sm font-medium text-red-800 dark:text-red-400 tabular-nums min-w-[4.5rem]">
                    {formatDate(report.date)}
                </time>

                {/* 标题 + 摘要 */}
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 group-hover:text-red-800 dark:group-hover:text-red-400 transition-colors leading-snug">
                        {label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 line-clamp-2">
                        {report.itemCount} 条信息差
                        {report.keywords.length > 0 && (
                            <>
                                {' · '}
                                {report.keywords[0].slice(0, 3).join('、')}
                            </>
                        )}
                    </p>
                </div>

                {/* 条数 */}
                <span className="flex-shrink-0 text-xs text-gray-400 dark:text-slate-500 mt-1.5 tabular-nums">
                    {report.itemCount} 条
                </span>
            </div>
        </a>
    );
}
