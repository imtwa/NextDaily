/**
 * 原始搜索结果 — 服务端渲染，使用 react-markdown 完整渲染 Markdown
 *
 * 从正文提取"原始搜索结果"部分，过滤 XML 工具调用块，
 * 使用 react-markdown + remark-gfm 渲染为酷黑风格。
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

/** 从原文提取并清理原始搜索结果 Markdown */
function extractRawSection(body: string): string {
    const idx = body.indexOf('## 原始搜索结果');
    if (idx === -1) return '';

    let text = body.slice(idx)
        // 去掉最后一级标题及之后的免责声明
        .replace(/^## 搜索词库[\s\S]*$/m, '')
        .replace(/^---\s*$/m, '')
        // 去掉 XML 工具调用块
        .replace(/<invoke name="[^"]*">[\s\S]*?<\/invoke>/gi, '')
        .replace(/<parameter[^>]*\/>/gi, '')
        .replace(/<parameter[^>]*>[\s\S]*?<\/parameter>/gi, '')
        .replace(/<tool_calls>[\s\S]*?<\/tool_calls>/gi, '')
        .replace(/<\/?details>|<\/?summary>/gi, '')
        .trim();

    return text;
}

/** 自定义 Markdown 渲染组件样式 */
const components: Components = {
    h2: ({ children, ...props }) => (
        <h2 className="text-sm font-bold text-paper-600 dark:text-paper-400 mt-6 mb-3 flex items-center gap-2" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-5 mb-2 pb-2 border-b border-paper-200 dark:border-paper-700/20" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }) => (
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-3 mb-1 uppercase tracking-wider" {...props}>
            {children}
        </h4>
    ),
    strong: ({ children, ...props }) => (
        <strong className="font-semibold text-slate-800 dark:text-slate-200" {...props}>
            {children}
        </strong>
    ),
    p: ({ children, ...props }) => (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed" {...props}>
            {children}
        </p>
    ),
    hr: (props) => (
        <hr className="my-3 border-paper-200 dark:border-paper-600/20" {...props} />
    ),
    ul: ({ children, ...props }) => (
        <ul className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-400" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-400" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="ml-4 list-disc" {...props}>
            {children}
        </li>
    ),
    code: ({ children, ...props }) => (
        <code className="text-xs bg-paper-100 dark:bg-paper-800/40 px-1 py-0.5 rounded" {...props}>
            {children}
        </code>
    ),
};

export default function RawResults({ body }: { body: string }) {
    const raw = extractRawSection(body);
    if (!raw) return null;

    return (
        <section className="mb-8">
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-3">
                原始搜索结果
            </h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 p-5 overflow-y-auto max-h-96">
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-p:mt-1 prose-p:leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                        {raw}
                    </ReactMarkdown>
                </div>
            </div>
        </section>
    );
}
