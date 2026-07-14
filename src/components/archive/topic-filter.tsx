'use client';

/**
 * 归档搜索过滤栏
 *
 * 提供搜索输入框、按月份/按主题视图切换、以及主题快速筛选按钮。
 * 所有状态由父组件 ArchiveSection 管理，通过 props 传递。
 */

import { useState, useCallback } from 'react';
import { Search, LayoutGrid, Calendar } from 'lucide-react';

/** 视图模式类型 */
export type ViewMode = 'month' | 'topic';

interface TopicFilterProps {
    /** 搜索文本变化回调 */
    onSearch: (query: string) => void;
    /** 视图模式切换回调 */
    onViewModeChange: (mode: ViewMode) => void;
    /** 当前视图模式 */
    viewMode: ViewMode;
    /** 所有可用主题列表 */
    allTopics: string[];
    /** 主题选中回调，null 表示显示全部 */
    onTopicSelect: (topic: string | null) => void;
    /** 当前选中的主题，null 表示全部 */
    selectedTopic: string | null;
}

export default function TopicFilter({
    onSearch,
    onViewModeChange,
    viewMode,
    allTopics,
    onTopicSelect,
    selectedTopic
}: TopicFilterProps) {
    const [query, setQuery] = useState('');

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value;
            setQuery(v);
            onSearch(v);
        },
        [onSearch]
    );

    return (
        <div className="space-y-4">
            {/* 搜索输入框 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="搜索报告…（按主题、日期、关键词）"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
                {/* 视图模式切换 */}
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button
                        onClick={() => onViewModeChange('month')}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                            viewMode === 'month'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}>
                        <Calendar className="w-4 h-4" />
                        按月份
                    </button>
                    <button
                        onClick={() => onViewModeChange('topic')}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                            viewMode === 'topic'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}>
                        <LayoutGrid className="w-4 h-4" />
                        按主题
                    </button>
                </div>

                {/* 主题快速筛选 pills — 仅在主题视图下显示 */}
                {viewMode === 'topic' && allTopics.length > 1 && (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => onTopicSelect(null)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                !selectedTopic
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}>
                            全部
                        </button>
                        {allTopics.map(t => (
                            <button
                                key={t}
                                onClick={() => onTopicSelect(t)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    selectedTopic === t
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}>
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
