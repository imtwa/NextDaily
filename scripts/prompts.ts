/**
 * 提示词加载模块
 *
 * 从 scripts/prompts/ 目录加载 Markdown 格式的 AI 提示词模板文件。
 * 提示词在模块加载时一次性读入内存，作为常量供 pipeline 使用。
 */

import fs from 'node:fs';
import path from 'node:path';

/** prompts/ 目录的绝对路径 */
const promptsDir = path.join(__dirname, 'prompts');

/**
 * 加载指定文件名的提示词
 *
 * @param filename - 提示词文件名（如 "keyword-generation.md"）
 *
 * @returns 去除首尾空白后的提示词全文
 *
 * @throws Error 当文件不存在时抛出
 */
function loadPrompt(filename: string): string {
    const filePath = path.join(promptsDir, filename);
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8').trim();
    }
    throw new Error(`提示词文件未找到: ${filePath}`);
}

/**
 * Stage 1 提示词 — 搜索词库生成
 *
 * 指导 AI 根据用户主题拆解出 3-5 组搜索关键词矩阵。
 */
export const KEYWORD_GEN_PROMPT = loadPrompt('keyword-generation.md');

/**
 * Stage 3 提示词 — 新闻过滤排序
 *
 * 指导 AI 从搜索结果中提取新闻条目，过滤三天前旧闻，按热度排序。
 */
export const FILTER_SORT_PROMPT = loadPrompt('filter-sort.md');
