'use client';

/**
 * 归档区域 — 客户端交互容器
 *
 * 管理搜索、视图切换、主题筛选等全部交互状态。
 * 客户端数据筛选逻辑在此完成（纯前端计算，不涉及 API 请求），
 * 原始报告数据由服务端页面组件通过 props 传入。
 */

import { useState, useMemo } from 'react';
import type { ReportMeta, MonthGroup, TopicGroup } from '@/lib/types';
import TopicFilter, { type ViewMode } from './topic-filter';
import MonthGroupComponent from './month-group';
import TopicGroupComponent from './topic-group';
import EmptyState from '../ui/empty-state';

// ─── 纯函数：客户端数据过滤/分组逻辑 ─────────────────────────────────────

/**
 * 根据查询字符串过滤报告列表
 *
 * 匹配主题、标题、日期、关键词。
 *
 * @param reports - 全部报告元数据
 * @param query   - 搜索查询字符串
 *
 * @returns 匹配的报告数组
 */
function filterReports(reports: ReportMeta[], query: string): ReportMeta[] {
    if (!query.trim()) return reports;
    const q = query.trim().toLowerCase();
    return reports.filter(
        r =>
            r.topic.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.date.includes(q) ||
            r.keywords.some(kw => kw.some(k => k.toLowerCase().includes(q)))
    );
}

/**
 * 将报告列表按月分组
 *
 * @param reports - 报告元数据数组
 *
 * @returns 按月份降序排列的分组
 */
function groupByMonth(reports: ReportMeta[]): MonthGroup[] {
    const groups = new Map<string, ReportMeta[]>();
    for (const r of reports) {
        const parts = r.date.split('-');
        const key = parts.length >= 2 ? `${parts[0]}年${parseInt(parts[1])}月` : '未知日期';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
    }
    return Array.from(groups.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, items]) => ({ month, reports: items }));
}

/**
 * 将报告列表按主题分组
 *
 * @param reports - 报告元数据数组
 *
 * @returns "热点新闻"置顶，其余按报告数降序的分组
 */
function groupByTopic(reports: ReportMeta[]): TopicGroup[] {
    const groups = new Map<string, ReportMeta[]>();
    for (const r of reports) {
        const key = r.topic || '热点新闻';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
    }
    return Array.from(groups.entries())
        .sort((a, b) => {
            if (a[0] === '热点新闻') return -1;
            if (b[0] === '热点新闻') return 1;
            return b[1].length - a[1].length;
        })
        .map(([topic, items]) => ({ topic, reports: items }));
}

/**
 * 提取所有不重复的主题
 *
 * @param reports - 全部报告元数据
 *
 * @returns 排序后的主题数组（"热点新闻"置顶）
 */
function getAllTopics(reports: ReportMeta[]): string[] {
    const topics = new Set<string>();
    for (const r of reports) {
        topics.add(r.topic || '热点新闻');
    }
    return Array.from(topics).sort((a, b) => (a === '热点新闻' ? -1 : b === '热点新闻' ? 1 : a.localeCompare(b)));
}

// ─── 主组件 ─────────────────────────────────────────────────────────────

export default function ArchiveSection({ reports }: { reports: ReportMeta[] }) {
    const [query, setQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    const allTopics = useMemo(() => getAllTopics(reports), [reports]);
    const filtered = useMemo(() => filterReports(reports, query), [reports, query]);

    const monthGroups = useMemo(() => groupByMonth(filtered), [filtered]);
    const topicGroups = useMemo(() => {
        let groups = groupByTopic(filtered);
        if (selectedTopic) {
            groups = groups.filter(g => g.topic === selectedTopic);
        }
        return groups;
    }, [filtered, selectedTopic]);

    return (
        <>
            <TopicFilter
                onSearch={setQuery}
                onViewModeChange={mode => {
                    setViewMode(mode);
                    setSelectedTopic(null);
                }}
                viewMode={viewMode}
                allTopics={allTopics}
                onTopicSelect={setSelectedTopic}
                selectedTopic={selectedTopic}
            />

            <div className="mt-8 space-y-12">
                {filtered.length === 0 ? (
                    <EmptyState />
                ) : viewMode === 'month' ? (
                    monthGroups.map(g => <MonthGroupComponent key={g.month} group={g} />)
                ) : (
                    topicGroups.map(g => <TopicGroupComponent key={g.topic} group={g} />)
                )}
            </div>
        </>
    );
}
