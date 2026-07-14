/**
 * 首页 — 新闻报刊风格左右双栏
 *
 * 服务端组件：构建时读取 content/ 获取全量报告元数据，
 * 传递给客户端组件 HomePageClient 进行交互渲染。
 *
 * 布局:
 *   左侧 (flex-1) — 文章列表，按月份分组，新闻条目行
 *   右侧 (w-56)   — 归档侧边栏，点击月份筛选左侧
 */

import { getAllReports } from '@/lib/report-utils';
import HomePageClient from './home-page-client';

export default function HomePage() {
    const reports = getAllReports();

    return <HomePageClient reports={reports} />;
}
