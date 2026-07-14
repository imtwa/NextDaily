/**
 * 全局类型定义
 *
 * 贯穿 scripts/ 和 src/ 的共享数据结构。
 * 确保 AI 生成脚本和 Next.js 前端使用一致的类型契约。
 */

/** 新闻条目 — Stage 3 AI 过滤排序后的最小展示单元 */
export interface NewsItem {
    title: string;
    brief: string;
}

/** 单路搜索结果 — Stage 2 并发搜索返回的原始数据 */
export interface SearchResult {
    index: number;
    keywords: string;
    content: string;
    charCount: number;
}

/**
 * 报告元数据 — 从 MD 文件的 YAML frontmatter 解析
 *
 * 供首页归档列表使用，包含足够的信息用于卡片展示和搜索过滤，
 * 无需加载完整的 Markdown 正文。
 */
export interface ReportMeta {
    /** URL slug = 文件名去 .md */
    slug: string;
    /** 报告标题，如 "每日信息差" 或 "每日信息差 - 新能源车" */
    title: string;
    /** 日期，格式 YYYY-MM-DD */
    date: string;
    /** 搜索主题，无主题时为空字符串 */
    topic: string;
    /** 新闻条目数量 */
    itemCount: number;
    /** 搜索词库矩阵 */
    keywords: string[][];
}

/** 完整报告 — 元数据 + Markdown 正文，供详情页使用 */
export interface Report {
    meta: ReportMeta;
    body: string;
}

/** 按月分组的报告 — 首页"按月份"视图 */
export interface MonthGroup {
    /** 月份标识，如 "2026年7月" */
    month: string;
    reports: ReportMeta[];
}

/** 按主题分组的报告 — 首页"按主题"视图 */
export interface TopicGroup {
    /** 主题名，无主题时为 "热点新闻" */
    topic: string;
    reports: ReportMeta[];
}
