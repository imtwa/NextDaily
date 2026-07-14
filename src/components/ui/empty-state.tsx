/**
 * 空状态提示组件
 *
 * 当 content/ 目录下没有任何报告时显示的引导界面。
 * 提示用户运行 npm run generate 来生成第一篇报告。
 */

import { FileText } from 'lucide-react';

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">暂无报告</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                还没有生成任何每日信息差报告。运行 &ldquo;npm run generate&rdquo; 来生成第一篇报告。
            </p>
        </div>
    );
}
