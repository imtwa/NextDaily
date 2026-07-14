/**
 * 报告数据工具模块
 *
 * 扫描 content/ 目录，解析 MD 文件的 YAML frontmatter，
 * 提供报告列表、单篇详情、按月/按主题分组、搜索、统计等功能。
 *
 * **注意**: 本模块依赖 node:fs，仅在服务端（构建时）使用。
 * 客户端组件应通过 props 接收数据，而非直接导入本模块。
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ReportMeta, Report, MonthGroup, TopicGroup } from './types';

/** content 目录的绝对路径 */
const CONTENT_DIR = path.join(process.cwd(), 'content');

// ─── 获取所有报告元数据 ─────────────────────────────────────────────────

/**
 * 扫描 content/ 目录，解析所有 MD 文件的 frontmatter 元数据
 *
 * 只解析 frontmatter，不加载正文，适合首页列表场景。
 * 结果按日期降序排列（最新的在前）。
 *
 * @returns 报告元数据数组，目录不存在或无 MD 文件时返回空数组
 */
export function getAllReports(): ReportMeta[] {
    if (!fs.existsSync(CONTENT_DIR)) {
        return [];
    }

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
    const reports: ReportMeta[] = [];

    for (const file of files) {
        const slug = file.replace(/\.md$/, '');
        const filePath = path.join(CONTENT_DIR, file);
        const raw = fs.readFileSync(filePath, 'utf-8');

        try {
            const { data } = matter(raw);
            reports.push({
                slug,
                title: String(data.title ?? '每日信息差'),
                date: String(data.date ?? ''),
                topic: String(data.topic ?? ''),
                itemCount: Number(data.itemCount ?? 0),
                keywords: Array.isArray(data.keywords) ? data.keywords : []
            });
        } catch {
            console.warn(`[WARN] 无法解析: ${file}`);
        }
    }

    reports.sort((a, b) => b.date.localeCompare(a.date));
    return reports;
}

// ─── 获取单篇报告 ───────────────────────────────────────────────────────

/**
 * 根据 slug 读取单篇完整报告（元数据 + Markdown 正文）
 *
 * @param slug - 文件名（不含 .md 扩展名）
 *
 * @returns 完整报告对象，文件不存在或解析失败时返回 null
 */
export function getReportBySlug(slug: string): Report | null {
    // Next.js 静态导出时会对中文 param 做 URL 编码（如 英雄联盟 → %E8%8B%B1...），
    // 导致直接用编码后的字符串读文件失败。这里先尝试 decodeURIComponent 还原。
    let resolvedSlug = slug;
    try {
        const decoded = decodeURIComponent(slug);
        resolvedSlug = decoded;
    } catch {
        // 非编码字符串 decodeURIComponent 会在遇到非编码场景时抛异常，保持原值即可
    }

    const filePath = path.join(CONTENT_DIR, `${resolvedSlug}.md`);

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');

    try {
        const { data, content } = matter(raw);
        const meta: ReportMeta = {
            slug,
            title: String(data.title ?? '每日信息差'),
            date: String(data.date ?? ''),
            topic: String(data.topic ?? ''),
            itemCount: Number(data.itemCount ?? 0),
            keywords: Array.isArray(data.keywords) ? data.keywords : []
        };

        return { meta, body: content };
    } catch {
        return null;
    }
}

// ─── 获取所有 slug ──────────────────────────────────────────────────────

/**
 * 列出 content/ 目录下所有 MD 文件的 slug
 *
 * 用于 generateStaticParams() 在构建时生成所有静态路由。
 *
 * @returns slug 字符串数组
 */
export function getAllSlugs(): string[] {
    if (!fs.existsSync(CONTENT_DIR)) {
        return [];
    }

    return fs
        .readdirSync(CONTENT_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace(/\.md$/, ''));
}

// ─── 按月分组 ───────────────────────────────────────────────────────────

/**
 * 将报告列表按月份分组，每组按月降序排列
 *
 * @returns 月份分组数组
 */
export function getReportsByMonth(): MonthGroup[] {
    const reports = getAllReports();
    const groups = new Map<string, ReportMeta[]>();

    for (const r of reports) {
        const parts = r.date.split('-');
        const monthKey = parts.length >= 2 ? `${parts[0]}年${parseInt(parts[1])}月` : '未知日期';

        if (!groups.has(monthKey)) {
            groups.set(monthKey, []);
        }
        groups.get(monthKey)!.push(r);
    }

    const sorted = Array.from(groups.entries()).sort((a, b) => {
        const toKey = (s: string) => {
            const m = s.match(/(\d+)年(\d+)月/);
            return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : '';
        };
        return toKey(b[0]).localeCompare(toKey(a[0]));
    });

    return sorted.map(([month, reports]) => ({ month, reports }));
}

// ─── 按主题分组 ─────────────────────────────────────────────────────────

/**
 * 获取所有不重复的主题列表
 *
 * 无主题的报告统一标记为 "热点新闻"。
 *
 * @returns 主题字符串数组（热点新闻置顶）
 */
export function getAllTopics(): string[] {
    const reports = getAllReports();
    const topics = new Set<string>();
    for (const r of reports) {
        topics.add(r.topic || '热点新闻');
    }
    return Array.from(topics).sort((a, b) => (a === '热点新闻' ? -1 : b === '热点新闻' ? 1 : a.localeCompare(b)));
}

/**
 * 将报告按主题分组，热点新闻置顶，其余按报告数量降序
 *
 * @returns 主题分组数组
 */
export function getReportsByTopic(): TopicGroup[] {
    const reports = getAllReports();
    const groups = new Map<string, ReportMeta[]>();

    for (const r of reports) {
        const key = r.topic || '热点新闻';
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(r);
    }

    const sorted = Array.from(groups.entries()).sort((a, b) => {
        if (a[0] === '热点新闻') return -1;
        if (b[0] === '热点新闻') return 1;
        return b[1].length - a[1].length;
    });

    return sorted.map(([topic, reports]) => ({ topic, reports }));
}

// ─── 搜索过滤 ───────────────────────────────────────────────────────────

/**
 * 根据查询字符串过滤报告列表
 *
 * 匹配范围：主题、标题、日期、关键词。
 *
 * @param query - 搜索查询字符串
 *
 * @returns 匹配的报告元数据数组
 */
export function searchReports(query: string): ReportMeta[] {
    const reports = getAllReports();
    if (!query.trim()) return reports;

    const q = query.trim().toLowerCase();
    return reports.filter(r => {
        return (
            r.topic.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.date.includes(q) ||
            r.keywords.some(kw => kw.some(k => k.toLowerCase().includes(q)))
        );
    });
}

// ─── 统计 ───────────────────────────────────────────────────────────────

/**
 * 获取站点统计信息
 *
 * @returns 包含总报告数、覆盖天数、覆盖主题数的统计对象
 */
export function getStats(): { totalReports: number; coverageDays: number; totalTopics: number } {
    const reports = getAllReports();
    const dates = new Set(reports.map(r => r.date));
    const topics = new Set(reports.map(r => r.topic || '热点新闻'));
    return {
        totalReports: reports.length,
        coverageDays: dates.size,
        totalTopics: topics.size
    };
}
