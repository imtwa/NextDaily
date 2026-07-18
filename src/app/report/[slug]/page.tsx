/**
 * 报告详情页 — 动态路由 [slug]
 *
 * 页面结构:
 *   1. 报告头部 — 标题、日期、主题
 *   2. 发布文案 — 可一键复制的抖音文案
 *   3. 搜索词库 — 可折叠面板
 *   4. 卡片预览 — 浏览器端 Canvas 渲染，可预览和下载
 *   5. 原始搜索结果
 *   6. 免责声明
 */

import { notFound } from 'next/navigation';
import { getAllSlugs, getReportBySlug } from '@/lib/report-utils';
import ReportHeader from '@/components/report/report-header';
import KeywordMatrix from '@/components/report/keyword-matrix';
import CopyTextSection from '@/components/report/copy-text-section';
import RawResults from '@/components/report/raw-results';
import CardPreviewSection from '@/components/card/card-preview-section';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
    const slugs = getAllSlugs();
    return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const report = getReportBySlug(slug);
    if (!report) return { title: '报告未找到' };
    return {
        title: `${report.meta.title} — 每日信息差`,
        description: `${report.meta.date} 每日信息差报告，共 ${report.meta.itemCount} 条新闻`
    };
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const report = getReportBySlug(slug);
    if (!report) notFound();

    const { meta, body } = report;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <a href="../"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition-colors mb-6">
                <ArrowLeft className="w-4 h-4" />
                返回列表
            </a>

            <ReportHeader meta={meta} />

            {/* 发布文案 — 可一键复制 */}
            <CopyTextSection body={body} date={meta.date} topic={meta.topic} />

            {/* 搜索词库 */}
            {meta.keywords.length > 0 && <KeywordMatrix keywords={meta.keywords} />}

            {/* 卡片预览 — 浏览器端 Canvas */}
            <CardPreviewSection
                body={body}
                title={meta.title}
                date={meta.date}
                topic={meta.topic}
            />

            {/* 原始搜索结果 */}
            <RawResults body={body} />

            <div className="mt-8 p-4 rounded-xl bg-paper-100 dark:bg-paper-800/10 border border-paper-200 dark:border-paper-700/20">
                <p className="text-sm text-paper-700 dark:text-paper-300">
                    <strong>免责声明</strong>：本报告由 AI 自动生成，仅供信息参考。
                </p>
            </div>
        </div>
    );
}
