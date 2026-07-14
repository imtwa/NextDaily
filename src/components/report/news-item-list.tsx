/**
 * 新闻列表容器
 *
 * 以报纸排版风格展示所有搜索词组摘要。
 * 每条均可点击展开查看原始搜索结果。
 * 无条目时显示空状态。
 */

import type { NewsItem as NewsItemType } from '@/lib/types';
import NewsItemComponent from './news-item';

interface Props {
    items: Array<NewsItemType & { rawContent?: string }>;
}

export default function NewsItemList({ items }: Props) {
    if (!items.length) {
        return (
            <div className="py-16 text-center">
                <p className="text-slate-400 dark:text-slate-500">暂无新闻条目</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">请运行生成脚本创建报告</p>
            </div>
        );
    }

    return (
        <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                信息差列表
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-slate-500">
                    {items.length} 组搜索
                </span>
            </h2>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, i) => (
                    <NewsItemComponent
                        key={i}
                        rank={i + 1}
                        title={item.title}
                        brief={item.brief}
                        rawContent={item.rawContent}
                    />
                ))}
            </div>
        </section>
    );
}
