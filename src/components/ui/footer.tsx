/**
 * 站点页脚
 *
 * 展示项目名称和 AI 自动生成免责声明。
 * 纯展示组件，无交互逻辑。
 */

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-paper-100 dark:bg-paper-800/10">
            <div className="max-w-6xl mx-auto px-4 py-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">每日信息差 — AI 驱动的每日新闻简报</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    本报告由 AI 自动生成，仅供信息参考。新闻条目经 AI 过滤排序，可能遗漏重要信息，请以原始来源为准。
                </p>
            </div>
        </footer>
    );
}
