/**
 * 月份分组组件
 *
 * 展示一个月内的所有报告，包含月份标题（带图标）和报告卡片网格。
 */

import { CalendarDays } from 'lucide-react';
import type { MonthGroup } from '@/lib/types';
import ReportGrid from './report-grid';

export default function MonthGroup({ group }: { group: MonthGroup }) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{group.month}</h2>
                <span className="text-sm text-slate-400 dark:text-slate-500">({group.reports.length} 篇)</span>
            </div>
            <ReportGrid reports={group.reports} />
        </section>
    );
}
