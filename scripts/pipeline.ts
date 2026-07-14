/**
 * Pipeline 编排模块
 *
 * 四阶段流水线的核心编排逻辑，负责协调 AI 调用的完整生命周期。
 * 每个阶段独立封装，便于单独测试和替换实现。
 *
 * 流水线阶段:
 *   Stage 1 — AI 生成搜索词库矩阵（根据用户主题拆解 3-5 组关键词）
 *   Stage 2 — 并发联网搜索（每组关键词并发调用 DeepSeek 联网搜索）
 *   Stage 3 — AI 过滤旧闻 + 热度排序（剔除三天前旧闻，去重合并）
 *   Stage 4 — 格式化 Markdown 报告 + 写入 content/ 目录
 *
 * 无主题时跳过 Stage 1 的 AI 调用，直接使用内置的默认热点新闻词库。
 */

import { generateText, getBeijingNow } from './ai-client';
import { KEYWORD_GEN_PROMPT, FILTER_SORT_PROMPT } from './prompts';
import {
    executeSearches,
    buildSearchContext,
    formatFinalReport,
    type SearchResult,
    type NewsItem
} from './search-engine';
import fs from 'node:fs';
import path from 'node:path';

// ─── 默认热点新闻词库 ───────────────────────────────────────────────────

/**
 * 当用户未指定主题时使用的默认热点新闻搜索词库
 *
 * 覆盖五大维度：国内政策、国际局势、科技产业、金融市场、社会民生。
 * 每个维度是一组独立的关键词列表，用于 Stage 2 并发搜索。
 *
 * @returns 5 组关键词构成的二维数组
 */
function defaultKeywordMatrix(): string[][] {
    return [
        ['国内', '重大政策', '国务院', '新规', '热点新闻'],
        ['国际', '地缘政治', '外交', '冲突', '最新动态'],
        ['科技', 'AI', '人工智能', '半导体', '互联网', '最新消息'],
        ['财经', '股市', '经济数据', '企业动态', '市场热点'],
        ['社会', '民生', '天气', '公共卫生', '热点事件']
    ];
}

// ─── 日期注入 ───────────────────────────────────────────────────────────

/**
 * 为关键词矩阵的每组关键词末尾追加当天日期
 *
 * 日期由代码生成（北京时间），避免 AI 幻觉导致日期错误。
 * 每组追加格式如 "2026年07月14日"，如已存在则跳过。
 *
 * @param matrix - 关键词矩阵，会被原地修改
 *
 * @returns 追加日期后的同一个矩阵引用
 */
function injectDate(matrix: string[][]): string[][] {
    const today = getBeijingNow();
    const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;
    for (const keywords of matrix) {
        if (!keywords.includes(dateStr)) {
            keywords.push(dateStr);
        }
    }
    return matrix;
}

// ─── Stage 1: 生成关键词矩阵 ────────────────────────────────────────────

/**
 * Stage 1 — 根据用户主题生成搜索关键词矩阵
 *
 * 有主题且 API Key 可用时，调用 AI 根据主题拆解出 3-5 组搜索关键词。
 * 无主题或 API 不可用时，降级使用默认热点词库。
 *
 * @param topic - 用户指定的搜索主题，如 "新能源车"、"二次元"，为 null 时使用默认词库
 *
 * @returns 关键词矩阵（二维字符串数组）
 */
async function stage1GenerateKeywordMatrix(topic?: string | null): Promise<string[][]> {
    console.log('[Stage 1] 生成搜索词库...');

    // 无主题 → 默认词库
    if (!topic || !topic.trim()) {
        const matrix = defaultKeywordMatrix();
        injectDate(matrix);
        console.log(`  无主题，使用默认热点词库 (${matrix.length} 组)`);
        for (let i = 0; i < matrix.length; i++) {
            console.log(`    ${i + 1}. ${matrix[i].join(' ').slice(0, 80)}`);
        }
        return matrix;
    }

    topic = topic.trim();
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
        console.warn('  [WARN] AI_API_KEY 未设置，使用默认词库');
        const matrix = defaultKeywordMatrix();
        matrix.unshift([topic, '最新消息', '热点']);
        injectDate(matrix);
        return matrix.slice(0, 5);
    }

    const today = getBeijingNow();
    const todayStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

    const userPrompt = `当前日期: ${todayStr}\n用户主题: ${topic}\n\n请根据当前日期和主题「${topic}」，拆解为 3-5 组搜索关键词矩阵。`;

    try {
        const response = await generateText(KEYWORD_GEN_PROMPT, userPrompt, {
            maxTokens: 2048,
            temperature: 0.3
        });
        const matrix = parseKeywordMatrix(response);
        injectDate(matrix);
        console.log(`  AI 生成 ${matrix.length} 组搜索关键词:`);
        for (let i = 0; i < matrix.length; i++) {
            console.log(`    ${i + 1}. ${matrix[i].join(', ').slice(0, 80)}`);
        }
        return matrix;
    } catch (e) {
        console.warn(`  [WARN] AI 词库生成失败: ${e}，降级为默认词库`);
        const matrix = defaultKeywordMatrix();
        matrix.unshift([topic, '最新消息', '热点']);
        injectDate(matrix);
        return matrix.slice(0, 5);
    }
}

/**
 * 从 AI 返回的 JSON 字符串中解析关键词矩阵
 *
 * 自动处理 markdown 代码块包裹和多余的空白。
 * 支持嵌套列表和扁平列表两种格式。
 *
 * @param response - AI 返回的原始文本
 *
 * @returns 解析后的二维关键词列表
 *
 * @throws Error 当 JSON 格式非法或解析结果为空时
 */
function parseKeywordMatrix(response: string): string[][] {
    let text = response.trim();

    // 去除 markdown 代码块标记
    if (text.startsWith('```')) {
        const lines = text.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines.length && lines[lines.length - 1].trim() === '```') lines.pop();
        text = lines.join('\n').trim();
    }

    // 定位 JSON 数组边界
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
        text = text.slice(start, end + 1);
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
        throw new Error('AI 返回的不是数组');
    }

    const matrix: string[][] = [];
    for (const item of data) {
        if (Array.isArray(item)) {
            const keywords = item.map((k: unknown) => String(k).trim()).filter((k: string) => k.length > 0);
            if (keywords.length) matrix.push(keywords);
        } else if (typeof item === 'string') {
            // 兼容扁平字符串列表
            matrix.push([item.trim()]);
        }
    }

    if (!matrix.length) {
        throw new Error('解析后的关键词矩阵为空');
    }

    return matrix;
}

// ─── Stage 3: AI 过滤排序 ───────────────────────────────────────────────

/**
 * Stage 3 — 将多路搜索结果交给 AI 进行过滤和排序
 *
 * 过滤掉发布时间超过 3 天的旧闻，合并报道同一事件的重复条目，
 * 按 S/A/B 三级重要性从高到低排列。
 *
 * API 不可用时降级为 fallbackItems（原始搜索摘要提取）。
 *
 * @param dateStr       - 日期字符串 (YYYY-MM-DD)
 * @param topic         - 搜索主题
 * @param keywordMatrix - 搜索词库矩阵
 * @param results       - Stage 2 的原始搜索结果列表
 *
 * @returns 过滤排序后的新闻条目列表
 */
async function stage3FilterSort(
    dateStr: string,
    topic: string,
    keywordMatrix: string[][],
    results: SearchResult[]
): Promise<NewsItem[]> {
    console.log('[Stage 3] AI 过滤排序...');

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
        console.warn('  [WARN] AI_API_KEY 未设置，返回原始摘要');
        return fallbackItems(results);
    }

    const searchContext = buildSearchContext(results);
    const totalChars = results.reduce((s, r) => s + r.charCount, 0);

    const keywordsOverview = keywordMatrix.map((kw, i) => `${i + 1}. ${kw.join(' ')}`).join('\n');

    const userPrompt = `今日日期: ${dateStr}
搜索主题: ${topic || '每日热点新闻'}
共 ${results.length} 路搜索，原始内容 ${totalChars} 字。

=== 搜索词库 ===
${keywordsOverview}

=== 原始搜索结果 ===
${searchContext}

请筛选新闻条目（只需筛选排序，不要改写标题和简述，保留原始素材的原文）。过滤掉昨天之前的旧闻（只保留昨天和今天），去重合并，按重要性排序后输出 JSON。至少输出 10 条。`;

    try {
        const response = await generateText(FILTER_SORT_PROMPT, userPrompt, {
            maxTokens: 8192,
            temperature: 0.3
        });
        const items = parseItemsJson(response);
        console.log(`  AI 过滤排序完成: ${items.length} 条`);
        return items;
    } catch (e) {
        console.warn(`  [WARN] AI 过滤排序失败: ${e}，返回原始摘要`);
        return fallbackItems(results);
    }
}

/**
 * 从 AI 返回的 JSON 中解析新闻条目列表
 *
 * 自动处理 markdown 代码块包裹，提取 {title, brief} 对象数组。
 *
 * @param response - AI 返回的原始文本
 *
 * @returns 新闻条目列表，每项包含 title 和 brief 字段
 *
 * @throws Error 当 JSON 格式非法时
 */
function parseItemsJson(response: string): NewsItem[] {
    let text = response.trim();

    if (text.startsWith('```')) {
        const lines = text.split('\n');
        if (lines[0].startsWith('```')) lines.shift();
        if (lines.length && lines[lines.length - 1].trim() === '```') lines.pop();
        text = lines.join('\n').trim();
    }

    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
        text = text.slice(start, end + 1);
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
        throw new Error('AI 返回的不是数组');
    }

    return data
        .filter((d: unknown): d is Record<string, unknown> => typeof d === 'object' && d !== null)
        .map(d => ({
            title: String(d.title ?? '').trim(),
            brief: String(d.brief ?? '').trim()
        }));
}

/**
 * AI 不可用时的备用提取方案
 *
 * 从每条原始搜索结果中取前 80 字作为简易摘要，
 * 跳过显式标记为"搜索异常"或"搜索未返回"的条目。
 *
 * @param results - 原始搜索结果列表
 *
 * @returns 简易的新闻条目列表
 */
function fallbackItems(results: SearchResult[]): NewsItem[] {
    const items: NewsItem[] = [];
    for (const r of results) {
        const text = r.content.replace(/\n/g, ' ').replace(/#/g, '').trim();
        if (text && !text.includes('搜索异常') && !text.includes('搜索未返回')) {
            const brief = text.length > 80 ? text.slice(0, 80) + '...' : text;
            items.push({
                title: `搜索${r.index}: ${r.keywords.slice(0, 30)}`,
                brief
            });
        }
    }
    return items;
}

// ─── Stage 4: 格式化输出 ───────────────────────────────────────────────

/**
 * Stage 4 — 拼接最终的 Markdown 报告并写入 content/ 目录
 *
 * 生成 YAML frontmatter（供 Next.js 构建时读取元数据）+
 * Markdown 正文（供详情页渲染）。
 *
 * @param dateStr       - 日期字符串
 * @param topic         - 搜索主题
 * @param keywordMatrix - 搜索词库矩阵
 * @param items         - Stage 3 过滤排序后的新闻条目
 * @param results       - Stage 2 原始搜索结果
 * @param contentDir    - content/ 目录的绝对路径
 * @param slug          - 文件名 slug（不含 .md 扩展名）
 *
 * @returns 完整的 Markdown 报告文本
 */
function stage4FormatAndWrite(
    dateStr: string,
    topic: string,
    keywordMatrix: string[][],
    items: NewsItem[],
    results: SearchResult[],
    contentDir: string,
    slug: string
): string {
    console.log('[Stage 4] 格式化报告...');

    // 生成 YAML frontmatter
    const keywordsYaml = keywordMatrix.map(kw => `  - [${kw.map(k => `"${k}"`).join(', ')}]`).join('\n');

    const frontmatter = `---
title: "${topic ? `每日信息差 - ${topic}` : '每日信息差'}"
date: "${dateStr}"
topic: "${topic}"
itemCount: ${items.length}
keywords:
${keywordsYaml}
---`;

    const body = formatFinalReport(dateStr, topic, keywordMatrix, items, results);
    const fullMd = `${frontmatter}\n\n${body}`;

    const filePath = path.join(contentDir, `${slug}.md`);
    fs.writeFileSync(filePath, fullMd, 'utf-8');

    console.log(`  报告已保存: ${filePath} (${fullMd.length} 字, ${items.length} 条)`);
    return fullMd;
}

// ─── 完整 Pipeline ──────────────────────────────────────────────────────

/** 流水线执行结果 */
export interface PipelineResult {
    report: string;
    keywordMatrix: string[][];
    items: NewsItem[];
    results: SearchResult[];
    slug: string;
    filePath: string;
}

/**
 * 运行完整的四阶段流水线
 *
 * 入口函数，协调 Stage 1-4 的执行并汇总日志和统计信息。
 * 支持按主题搜索、手动指定关键词、跳过 AI 过滤三种模式。
 *
 * @param contentDir - content/ 目录的绝对路径，报告将写入此目录
 * @param options     - 可选配置
 * @param options.topic          - 搜索主题，null 表示默认热点
 * @param options.manualKeywords - 手动指定的关键词矩阵，提供时跳过 Stage 1
 * @param options.noFilter       - 是否跳过 Stage 3 AI 过滤
 *
 * @returns 包含报告文本、关键词矩阵、新闻条目、搜索结果和文件路径的结果对象
 *
 * @throws Error 当 AI_API_KEY 环境变量未设置时抛出
 */
export async function runPipeline(
    contentDir: string,
    options?: {
        topic?: string | null;
        manualKeywords?: string[][] | null;
        noFilter?: boolean;
    }
): Promise<PipelineResult> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
        throw new Error("AI_API_KEY 未设置。请设置环境变量: export AI_API_KEY='sk-xxx'");
    }

    const topic = options?.topic ?? null;
    const manualKeywords = options?.manualKeywords ?? null;
    const noFilter = options?.noFilter ?? false;

    const totalStart = Date.now();
    const now = getBeijingNow();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Stage 1: 关键词矩阵
    let keywordMatrix: string[][];
    if (manualKeywords) {
        keywordMatrix = manualKeywords;
        console.log(`[Stage 1] 使用手动指定的关键词矩阵 (${keywordMatrix.length} 组)`);
    } else {
        keywordMatrix = await stage1GenerateKeywordMatrix(topic);
    }
    const t1 = Date.now();

    // Stage 2: 并发搜索
    const results = await executeSearches(keywordMatrix);
    const t2 = Date.now();

    // Stage 3: AI 过滤排序
    let items: NewsItem[];
    if (noFilter) {
        items = fallbackItems(results);
        console.log(`[Stage 3] 跳过 AI 过滤，共 ${items.length} 条原始摘要`);
    } else {
        items = await stage3FilterSort(dateStr, topic || '', keywordMatrix, results);
    }
    const t3 = Date.now();

    // Stage 4: 格式化 — slug 格式: 日期-主题 或 仅日期
    const slug = dateStr + (topic ? `-${slugify(topic)}` : '');

    const report = stage4FormatAndWrite(dateStr, topic || '', keywordMatrix, items, results, contentDir, slug);
    const t4 = Date.now();

    // 汇总日志
    console.log('='.repeat(50));
    console.log('[Pipeline] 全流程耗时:');
    console.log(`  Stage 1 词库生成: ${((t1 - totalStart) / 1000).toFixed(1)}s`);
    console.log(`  Stage 2 并发搜索: ${((t2 - t1) / 1000).toFixed(1)}s`);
    console.log(`  Stage 3 AI 过滤:  ${((t3 - t2) / 1000).toFixed(1)}s`);
    console.log(`  Stage 4 格式化:   ${((t4 - t3) / 1000).toFixed(1)}s`);
    console.log(`  总耗时:           ${((t4 - totalStart) / 1000).toFixed(1)}s`);
    console.log(`  主题:             ${topic || '(默认热点)'}`);
    console.log(`  搜索组数:         ${keywordMatrix.length}`);
    console.log(`  搜索结果:         ${results.length} 路`);
    console.log(`  过滤后条数:       ${items.length} 条`);
    console.log(`  报告字数:         ${report.length} 字`);
    console.log('='.repeat(50));

    return {
        report,
        keywordMatrix,
        items,
        results,
        slug,
        filePath: path.join(contentDir, `${slug}.md`)
    };
}

// ─── 工具函数 ───────────────────────────────────────────────────────────

/**
 * 将中文文本转换为 URL 友好的 slug
 *
 * 保留字母、数字和连字符，中文字符替换为连字符，连续连字符合并。
 *
 * @param text - 原始文本（可包含中文）
 *
 * @returns slug 字符串
 */
function slugify(text: string): string {
    return (
        text
            .replace(/[^\w一-鿿-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase() || 'report'
    );
}
