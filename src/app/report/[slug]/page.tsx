/**
 * 报告详情页 — 动态路由 [slug]
 *
 * 服务端组件：在构建时通过 generateStaticParams() 扫描 content/ 生成所有静态路由，
 * 每个报告渲染为独立的 HTML 文件。
 *
 * 页面结构:
 *   1. 返回按钮（回到首页）
 *   2. 报告头部 — 标题、日期、主题标签、条数
 *   3. 搜索词库 — 可折叠面板展示关键词矩阵
 *   4. 原始搜索结果 — 平铺展示所有搜索返回的新闻条目
 *   5. 免责声明
 */

import { notFound } from 'next/navigation';
import { getAllSlugs, getReportBySlug } from '@/lib/report-utils';
import ReportHeader from '@/components/report/report-header';
import KeywordMatrix from '@/components/report/keyword-matrix';
import SortedNews from '@/components/report/sorted-news';
import RawResults from '@/components/report/raw-results';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

// ─── 静态路由生成 ───────────────────────────────────────────────────────

export function generateStaticParams() {
    const slugs = getAllSlugs();
    return slugs.map(slug => ({ slug }));
}

// ─── 页面元数据 ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const report = getReportBySlug(slug);
    if (!report) return { title: '报告未找到' };

    return {
        title: `${report.meta.title} — 每日信息差`,
        description: `${report.meta.date} 每日信息差报告，共 ${report.meta.itemCount} 条新闻`
    };
}

// ─── 详情页主体 ─────────────────────────────────────────────────────────

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const report = getReportBySlug(slug);

    if (!report) {
        notFound();
    }

    const { meta, body } = report;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
            {/* 返回按钮 */}
            <a
                href="../"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" />
                返回列表
            </a>

            <ReportHeader meta={meta} />

            {/* 搜索词库 */}
            {meta.keywords.length > 0 && <KeywordMatrix keywords={meta.keywords} />}

            {/* 重点新闻 — Stage 3 筛选排序后的条目 */}
            <SortedNews body={body} />

            {/* 原始搜索结果 — 平铺，无折叠 */}
            <RawResults body={body} />

            {/* 免责声明 */}
            <div className="mt-8 p-4 rounded-xl bg-paper-100 dark:bg-paper-800/10 border border-paper-200 dark:border-paper-700/20">
                <p className="text-sm text-paper-700 dark:text-paper-300">
                    <strong>免责声明</strong>：本报告由 AI 自动生成，仅供信息参考。新闻条目经 AI
                    过滤排序，可能遗漏重要信息，请以原始来源为准。
                </p>
            </div>
        </div>
    );
}
