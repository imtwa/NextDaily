/**
 * 主题分组组件
 *
 * 展示一个主题下的所有报告，包含主题标题（带图标）和报告卡片网格。
 */

import { Tag } from 'lucide-react';
import type { TopicGroup } from '@/lib/types';
import ReportGrid from './report-grid';

export default function TopicGroup({ group }: { group: TopicGroup }) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{group.topic}</h2>
                <span className="text-sm text-slate-400 dark:text-slate-500">({group.reports.length} 篇)</span>
            </div>
            <ReportGrid reports={group.reports} />
        </section>
    );
}
