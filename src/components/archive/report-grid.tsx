/**
 * 报告卡片网格容器
 *
 * 响应式网格布局：移动端 1 列 → 平板 2 列 → 桌面 3 列。
 */

import type { ReportMeta } from '@/lib/types';
import ReportCard from './report-card';

export default function ReportGrid({ reports }: { reports: ReportMeta[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map(r => (
                <ReportCard key={r.slug} report={r} />
            ))}
        </div>
    );
}
