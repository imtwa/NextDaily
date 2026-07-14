'use client';

/**
 * 单条新闻条目 — 可展开查看原始搜索结果
 *
 * 展示搜索词组的摘要。点击可展开查看 AI 联网搜索返回的原始新闻列表。
 * 原始内容中的 Markdown 标题、加粗、列表等会渲染为富文本。
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';

interface Props {
    rank: number;
    title: string;
    brief: string;
    rawContent?: string;
}

/** 将原始搜索结果的 Markdown 转为简单 HTML */
function renderRawContent(md: string): string {
    let html = md
        // 转义 HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // 标题 ### / ##
        .replace(/^### (.+)$/gm, '<h4 class="text-sm font-bold text-paper-800 dark:text-paper-300 mt-4 mb-2">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-paper-800 dark:text-paper-200 mt-4 mb-2">$1</h3>')
        // 加粗 **text**
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>')
        // 分隔线
        .replace(/^---$/gm, '<hr class="my-3 border-paper-200 dark:border-paper-700/20">')
        // 列表项：1. / 2. 等
        .replace(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/gm,
            '<div class="flex gap-2 mt-2"><span class="text-red-700 dark:text-red-400 font-medium text-xs min-w-[1.2rem]">$1.</span><div><strong class="font-semibold text-slate-900 dark:text-slate-100">$2</strong><span class="text-slate-600 dark:text-slate-400">$3</span></div></div>')
        .replace(/^(\d+)\.\s+(.+)$/gm,
            '<div class="flex gap-2 mt-1"><span class="text-red-700 dark:text-red-400 font-medium text-xs min-w-[1.2rem]">$1.</span><span class="text-slate-700 dark:text-slate-300">$2</span></div>')
        // 段落：连续非空行
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');

    return html;
}

export default function NewsItem({ rank, title, brief, rawContent }: Props) {
    const [expanded, setExpanded] = useState(false);

    const renderedContent = useMemo(
        () => (rawContent ? renderRawContent(rawContent) : ''),
        [rawContent]
    );

    return (
        <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
            {/* 摘要行 — 始终可见 */}
            <button
                onClick={() => rawContent && setExpanded(!expanded)}
                className={`w-full flex gap-4 py-4 text-left group transition-colors ${
                    rawContent
                        ? 'cursor-pointer hover:bg-paper-100/50 dark:hover:bg-paper-800/5'
                        : 'cursor-default'
                }`}>
                {/* 序号圆圈 */}
                <span className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400 flex items-center justify-center text-sm font-semibold group-hover:bg-red-200 dark:group-hover:bg-red-900/40 transition-colors">
                    {rank}
                </span>

                <div className="min-w-0 pt-0.5 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {title.replace(/^搜索\d+:\s*/, '')}
                    </h3>
                    {brief && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {brief}
                        </p>
                    )}
                </div>

                {/* 展开/收起图标 */}
                {rawContent && (
                    <span className="flex-shrink-0 mt-1 text-slate-400 dark:text-slate-500">
                        {expanded ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </span>
                )}
            </button>

            {/* 展开的原始搜索内容 */}
            {expanded && rawContent && (
                <div className="pb-4 px-4 ml-13">
                    <div className="rounded-xl border border-paper-200 dark:border-paper-700/20 bg-paper-50 dark:bg-paper-800/5 p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-paper-200 dark:border-paper-700/20">
                            <Globe className="w-4 h-4 text-red-700 dark:text-red-400" />
                            <span className="text-xs font-semibold text-paper-600 dark:text-paper-400 tracking-wide">
                                原始搜索结果
                            </span>
                        </div>
                        <div
                            className="text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                            dangerouslySetInnerHTML={{ __html: renderedContent }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
