/**
 * 并发搜索执行模块
 *
 * 接收关键词矩阵（每组为一个关键词列表），使用信号量模式控制并发数
 * 调用 AI 联网搜索，返回结构化的搜索结果列表。
 *
 * 同时提供搜索上下文构建和最终 Markdown 报告格式化功能。
 */

import { webSearch } from './ai-client';

// ─── 类型 ───────────────────────────────────────────────────────────────

/** 单路搜索结果 */
export interface SearchResult {
    /** 序号（从 1 开始） */
    index: number;
    /** 搜索关键词（空格连接） */
    keywords: string;
    /** 搜索返回的正文内容 */
    content: string;
    /** 内容字数 */
    charCount: number;
}

/** AI 过滤排序后的新闻条目 */
export interface NewsItem {
    /** 新闻标题 */
    title: string;
    /** 一句话简述 */
    brief: string;
}

// ─── 并发搜索 ───────────────────────────────────────────────────────────

/**
 * 单路搜索的工作函数
 *
 * 将关键词列表用空格拼接为搜索查询，内置错峰延迟避免多路搜索同时冲击 API。
 *
 * @param index     - 搜索序号（从 0 开始），用于错峰延迟计算
 * @param keywords  - 关键词列表，如 ['二次元', '动漫', '新番']
 * @param staggerMs - 每路之间的错峰毫秒数，默认 200ms
 *
 * @returns 搜索结果对象
 */
async function searchWorker(index: number, keywords: string[], staggerMs: number = 200): Promise<SearchResult> {
    // 错峰启动，避免同时冲击 API
    await new Promise(r => setTimeout(r, index * staggerMs));

    const query = keywords.join(' ');
    // 只传关键词，不塞长指令。时间和格式要求由 ai-client 的 webSearch 统一处理
    const content = await webSearch(query);
    const finalContent = content || '（搜索未返回结果）';

    return {
        index: index + 1,
        keywords: query,
        content: finalContent,
        charCount: finalContent.length
    };
}

/**
 * 并发执行多路联网搜索
 *
 * 使用信号量模式控制最大并发数，避免超出 API 速率限制。
 * 单路搜索失败时该条目 content 为错误提示文本而不丢弃。
 *
 * @param keywordMatrix  - 关键词矩阵，如 [['二次元','动漫'], ['原神','新版本']]
 * @param maxConcurrency - 最大并发数，默认 5
 *
 * @returns 搜索结果列表，按原始 index 顺序排列
 */
export async function executeSearches(keywordMatrix: string[][], maxConcurrency: number = 5): Promise<SearchResult[]> {
    if (!keywordMatrix.length) {
        console.warn('[WARN] 无搜索词，跳过搜索阶段');
        return [];
    }

    console.log(`\n[搜索阶段] ${keywordMatrix.length} 路并发搜索 (max_workers=${maxConcurrency})...`);

    const startTime = Date.now();
    const results: SearchResult[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < keywordMatrix.length; i++) {
        const p = searchWorker(i, keywordMatrix[i]).then(r => {
            results.push(r);
            console.log(`  [${r.index}/${keywordMatrix.length}] 完成 (${r.charCount} 字)`);
        });

        executing.push(p);

        if (executing.length >= maxConcurrency) {
            await Promise.race(executing);
            // 清理已完成的 Promise
            for (let j = executing.length - 1; j >= 0; j--) {
                const settled = await Promise.race([
                    executing[j].then(() => true),
                    new Promise<boolean>(r => setTimeout(() => r(false), 0))
                ]);
                if (settled) executing.splice(j, 1);
            }
        }
    }

    await Promise.all(executing);

    // 按 index 升序排列
    results.sort((a, b) => a.index - b.index);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalChars = results.reduce((s, r) => s + r.charCount, 0);
    console.log(`  搜索完成: ${results.length}/${keywordMatrix.length} 路, ${elapsed}s, 共 ${totalChars} 字`);

    return results;
}

// ─── 构建搜索上下文 ─────────────────────────────────────────────────────

/**
 * 将多路搜索结果拼接为 AI 过滤排序阶段的上下文输入
 *
 * 每条结果带序号和搜索词标注，用分隔线隔开。
 *
 * @param results - 搜索结果列表
 *
 * @returns 拼接后的搜索上下文字符串
 */
export function buildSearchContext(results: SearchResult[]): string {
    const parts = results.map(r => `=== 搜索 ${r.index}: ${r.keywords} ===\n\n${r.content}`);
    return parts.join('\n\n') || '（无搜索结果）';
}

// ─── 格式化最终报告 ─────────────────────────────────────────────────────

/**
 * 将过滤排序后的新闻条目格式化为最终 Markdown 报告
 *
 * 报告结构: 标题 → 日期和统计 → 搜索词库 → 信息差列表 → 原始搜索结果（折叠） → 免责声明
 *
 * @param dateStr       - 日期字符串 (YYYY-MM-DD)
 * @param topic         - 搜索主题（无主题时为空字符串）
 * @param keywordMatrix - 使用的关键词矩阵
 * @param items         - Stage 3 过滤排序后的新闻条目列表
 * @param rawResults    - Stage 2 的原始搜索结果列表
 *
 * @returns 格式化后的 Markdown 报告全文
 */
export function formatFinalReport(
    dateStr: string,
    topic: string,
    keywordMatrix: string[][],
    items: NewsItem[],
    rawResults: SearchResult[]
): string {
    const lines: string[] = [];

    // 标题 + 元信息
    const title = topic ? `# 每日信息差 - ${topic}` : '# 每日信息差';
    lines.push(title);
    lines.push(`日期: ${dateStr} | 共 ${items.length} 条精选`);
    lines.push('');

    // 信息差列表
    lines.push('---');
    lines.push('');
    lines.push(`## 信息差列表 (${items.length} 条)`);
    lines.push('');

    if (items.length > 0) {
        for (const item of items) {
            lines.push(`### ${item.title}`);
            if (item.brief) {
                // 去掉 "简述：" "原标题：" "简介：" 等前缀
                let b = item.brief.trim();
                b = b.replace(/^\*{0,2}(?:原文简述|简述|简介|摘要|概要|原标题|原文标题|时间)\s*[:：]?\s*\*{0,2}\s*/, '');
                lines.push(b);
            }
            lines.push('');
        }
    } else {
        lines.push('> 暂无符合条件的新闻条目。');
        lines.push('');
    }

    lines.push('---');
    lines.push('');

    // 搜索词库
    lines.push('## 搜索词库');
    lines.push('');
    for (let i = 0; i < keywordMatrix.length; i++) {
        lines.push(`${i + 1}. \`${keywordMatrix[i].join(' ')}\``);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // 原始搜索结果 — 完整输出，不做摘要
    lines.push('## 原始搜索结果');
    lines.push('');
    for (const r of rawResults) {
        lines.push(`### 搜索 ${r.index}. ${r.keywords}`);
        lines.push('');
        lines.push(r.content);
        lines.push('');
    }    // 页脚
    lines.push('---');
    lines.push('> **免责声明**: 本报告由 AI 自动生成，仅供信息参考。');
    lines.push('> 新闻条目经 AI 过滤排序，可能遗漏重要信息，请以原始来源为准。');

    return lines.join('\n');
}
