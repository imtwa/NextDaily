/**
 * 原始搜索结果 — 服务端渲染，平铺展示
 *
 * 从正文提取"原始搜索结果"，去掉 XML 工具调用块。
 * 只做基础 Markdown（加粗、标题、分隔线），不逐条格式化新闻。
 */

import React from 'react';

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 将原始搜索结果渲染为基础 HTML，保留可读性但不逐条美化 */
function renderRawSection(raw: string): string {
    let text = raw
        .replace(/<details>/gi, '').replace(/<\/details>/gi, '')
        .replace(/^## 原始搜索结果\s*/g, '')
        .replace(/<summary>[\s\S]*?<\/summary>/gi, '')
        // 去掉 XML 工具调用块
        .replace(/<invoke name="[^"]*">[\s\S]*?<\/invoke>/gi, '')
        .replace(/<parameter[^>]*\/>/gi, '')
        .replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, '')
        .replace(/<tool_calls>[\s\S]*?<\/tool_calls>/gi, '');

    const lines = text.split('\n');
    const parts: string[] = [];

    for (const line of lines) {
        const t = line.trim();
        if (!t) continue;

        // 跳过残留 XML 标签
        if (/^<\/?(tool_calls|invoke|parameter|xml)/.test(t)) continue;

        // ### N. keywords — 搜索分组标题
        const h3m = t.match(/^### \d+\.\s+(.+)/);
        if (h3m) {
            parts.push(
                `<h3 class="text-sm font-bold text-paper-600 dark:text-paper-400 mt-5 mb-2 pb-2 border-b border-paper-200 dark:border-paper-700/20">${esc(h3m[1])}</h3>`
            );
            continue;
        }

        // ### 一般子标题
        const h4m = t.match(/^###\s+(.+)/);
        if (h4m) {
            parts.push(`<h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 mt-3 mb-1">${esc(h4m[1])}</h4>`);
            continue;
        }

        // --- 分隔线
        if (/^---+$/.test(t)) {
            parts.push('<hr class="my-2 border-paper-200 dark:border-paper-600/20">');
            continue;
        }

        // 普通行：加粗处理 + 转义
        const p = t.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-800 dark:text-slate-200">$1</strong>');
        parts.push(`<p class="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">${p}</p>`);
    }

    return parts.join('\n');
}

export default function RawResults({ body }: { body: string }) {
    const idx = body.indexOf('## 原始搜索结果');
    if (idx === -1) return null;

    const raw = body.slice(idx);
    const html = renderRawSection(raw);
    if (!html) return null;

    return (
        <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-3">
                原始搜索结果
            </h2>
            <div
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-5 text-sm leading-relaxed max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </section>
    );
}
