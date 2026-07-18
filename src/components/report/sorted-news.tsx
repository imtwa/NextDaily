/**
 * 重点新闻列表 — 从正文"信息差列表"解析 Stage 3 筛选排序后的条目
 *
 * 服务端组件，提取每条新闻的标题和简述，渲染为带编号的列表。
 */

import React from 'react';

interface Item {
    title: string;
    brief: string;
}

/** 从正文中解析 "信息差列表" 条目，遇到 "## 原始搜索结果" / "搜索词库" 即停止 */
function parseSortedItems(body: string): Item[] {
    const idx = body.indexOf('## 信息差列表');
    if (idx === -1) return [];

    // 截取从 信息差列表 到下一个 ## 标题之间的内容
    const section = body.slice(idx);
    const endIdx = (() => {
        // 找下一个二级标题（排除 信息差列表 自身）
        const m = section.match(/^## (?!信息差列表)/m);
        return m ? idx + m.index! : section.length;
    })();
    const block = body.slice(idx, endIdx);

    const items: Item[] = [];
    const lines = block.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

                // 匹配 "### Title"
        const h3m = line.match(/^###\s+(?:\[[SABC]\]\s*)?(.+)$/);
        if (h3m) {
            const title = h3m[1].trim();
            if (!title || title.includes('暂无符合')) { i++; continue; }

            let brief = '';
            let source = '';
            // 向后扫描多行：直接文本行作为 brief，以 —— 开头的行作为 source
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const nl = lines[j].trim();
                if (!nl) continue;
                if (nl.startsWith('——') || nl.startsWith('--')) {
                    source = nl.replace(/^——+\s*/, '').replace(/^--+\s*/, '');
                    break;
                }
                if (nl.startsWith('###') || nl.startsWith('---') || nl.startsWith('## ')) break;
                if (nl.startsWith('>')) {
                    brief = nl.replace(/^>\s*/, '');
                    break;
                }
                // 普通文本行（可能是简介，但需要防吞后面的标题行）
                brief = nl;
                // 看看下一行是不是来源行或空行
                const next = lines[j + 1]?.trim() || '';
                if (next.startsWith('——') || next.startsWith('--') || !next) {
                    break;
                }
            }

            items.push({ title, brief });
        }
        i++;
    }

    return items;
}

export default function SortedNews({ body }: { body: string }) {
    const items = parseSortedItems(body);
    if (items.length === 0) return null;

    return (
        <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                信息差列表
                <span className="ml-2 text-sm font-normal text-slate-400">
                    {items.length} 条
                </span>
            </h2>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, i) => {
                    // 去掉 "搜索N: " 前缀，保留有意义的标题部分
                    const displayTitle = item.title.replace(/^搜索\d+:\s*/, '');
                    return (
                        <div key={i} className="flex gap-4 p-4">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/25 text-red-700 dark:text-red-400 flex items-center justify-center text-sm font-semibold">
                                {i + 1}
                            </span>
                            <div className="min-w-0 pt-0.5">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                                    {displayTitle}
                                </h3>
                                {item.brief && (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {item.brief}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
