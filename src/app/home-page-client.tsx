'use client';

/**
 * 首页客户端包装 — 管理月份筛选状态
 *
 * 从服务端组件接收全量报告数据，协调 ArticleList 和 ArchiveSidebar
 * 之间的交互。selectedMonth 状态在此提升，两个子组件通过 props 通信。
 */

import { useState } from 'react';
import type { ReportMeta } from '@/lib/types';
import ArticleList from '@/components/archive/article-list';
import ArchiveSidebar from '@/components/archive/archive-sidebar';

export default function HomePageClient({ reports }: { reports: ReportMeta[] }) {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* 左侧 — 文章列表 */}
                <main className="flex-1 min-w-0">
                    <ArticleList reports={reports} selectedMonth={selectedMonth} />
                </main>

                {/* 右侧 — 归档侧边栏 */}
                <ArchiveSidebar
                    reports={reports}
                    selectedMonth={selectedMonth}
                    onSelectMonth={setSelectedMonth}
                />
            </div>
        </div>
    );
}
