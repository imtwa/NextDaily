/**
 * AI 客户端模块
 *
 * 基于 Vercel AI SDK 封装，提供两个核心能力：
 *   generateText() — 通用聊天补全（Stage 1 关键词生成、Stage 3 过滤排序）
 *   webSearch()   — DeepSeek 联网搜索（Stage 2 并发搜索）
 *
 * 切换 AI 供应商（DeepSeek → OpenAI 等）只需修改本文件：
 *   1. 导入对应的 provider（如 createOpenAI）
 *   2. 修改 chatModel 中的模型名
 *   3. webSearch 需替换为对应的联网搜索实现
 */

/**
 * 统一 AI 客户端模块
 *
 * 基于 Vercel AI SDK 封装，提供供应商无关的 AI 调用能力。
 * 切换 AI 供应商（DeepSeek / OpenAI / Anthropic）只需修改本文件开头的 provider 创建逻辑，
 * 其余业务代码无需任何改动。
 *
 * 对外接口:
 *   - generateText()  - 通用聊天补全，用于 Stage 1 关键词生成和 Stage 3 过滤排序
 *   - webSearch()     - 联网搜索，用于 Stage 2 并发搜索（当前使用 DeepSeek 专用端点）
 *   - getBeijingNow() - 获取当前北京时间（UTC+8）
 */

import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText as aiGenerateText } from 'ai';

// ─── Provider 配置 ──────────────────────────────────────────────────────
// 切换供应商只需修改以下两处：
//   1. 导入对应的 provider 创建函数（如 createOpenAI）
//   2. 修改 chatModel 中的模型名（如 'gpt-4o-mini'）

/** DeepSeek provider 实例 */
const provider = createDeepSeek({
    apiKey: process.env.AI_API_KEY
});

/** 默认聊天模型 */
const chatModel = provider('deepseek-v4-flash');

// ─── Token 统计 ────────────────────────────────────────────────────────

/** 累计输入 token 数 */
let totalPromptTokens = 0;
/** 累计输出 token 数 */
let totalCompletionTokens = 0;

/**
 * 获取 Token 统计（用于流水线汇总）
 *
 * @returns 累计的输入/输出 token 数
 */
export function getTokenStats(): { promptTokens: number; completionTokens: number } {
    return { promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens };
}

// ─── 北京时间 ───────────────────────────────────────────────────────────

/**
 * 获取当前北京时间（UTC+8）
 *
 * @returns 北京时区的 Date 对象
 */
export function getBeijingNow(): Date {
    const now = new Date();
    const localOffset = now.getTimezoneOffset(); // 本地与 UTC 的分钟差，UTC+8 为 -480
    const beijingOffset = -480; // 北京 UTC+8
    const diff = localOffset - beijingOffset; // 需要调整的分钟数
    return diff === 0 ? now : new Date(now.getTime() + diff * 60 * 1000);
}

// ─── 通用聊天补全 ───────────────────────────────────────────────────────

/**
 * 调用 AI 大模型进行通用文本生成
 *
 * 底层使用 Vercel AI SDK 的 generateText，自动处理流式响应和错误重试。
 * 用于 Stage 1（关键词矩阵生成）和 Stage 3（新闻过滤排序）。
 *
 * @param systemPrompt - 系统提示词，定义 AI 的角色和输出格式
 * @param userPrompt   - 用户提示词，包含具体的任务描述和输入数据
 * @param options      - 可选参数
 * @param options.maxTokens   - 最大返回 token 数，默认 16384
 * @param options.temperature - 生成温度 (0.0-1.0)，越低越确定，默认 0.6
 *
 * @returns AI 生成的文本内容
 *
 * @throws Error 当 AI_API_KEY 环境变量未设置时抛出
 */
export async function generateText(
    systemPrompt: string,
    userPrompt: string,
    options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
        throw new Error("AI_API_KEY 未设置。请设置环境变量: export AI_API_KEY='sk-xxx'");
    }

    const result = await aiGenerateText({
        model: chatModel,
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: options?.maxTokens ?? 16384,
        temperature: options?.temperature ?? 0.6
    });

    const usage = result.usage;
    if (usage) {
        const inTokens = usage.promptTokens ?? 0;
        const outTokens = usage.completionTokens ?? 0;
        totalPromptTokens += inTokens;
        totalCompletionTokens += outTokens;
        console.log(`  [token] generateText: ${inTokens} in / ${outTokens} out`);
    }

    return result.text;
}

// ─── 联网搜索 ───────────────────────────────────────────────────────────

/**
 * 通过 DeepSeek Anthropic 兼容端点执行联网搜索
 *
 * 在查询前自动注入当天日期以确保搜索结果的时效性。
 * 内置 2 次重试机制，失败时返回空字符串而非抛出异常。
 *
 * **注意**: 此功能依赖 DeepSeek 的 web_search_20250305 工具调用能力。
 * 切换到其他 AI 供应商时需要替换为对应的联网搜索实现（如 OpenAI 的 web_search
 * response_format、或第三方搜索 API）。
 *
 * @param query - 搜索关键词
 *
 * @returns 搜索结果文本（含摘要和来源），失败时返回空字符串
 */
export async function webSearch(query: string): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) return '';

    const today = getBeijingNow();
    const dateStr = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;
    const fullQuery = `搜索以下关键词，只返回昨天(${dateStr}前1天)和今天(${dateStr})的最新新闻。每条新闻标注具体时间（如「7月14日凌晨」「7月15日上午」），无时间的标「时间未明确」。禁止使用emoji。\n\n关键词: ${query}`;

    // 联网搜索使用 DeepSeek Anthropic 兼容端点 + tool_use
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const resp = await fetch('https://api.deepseek.com/anthropic/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'deepseek-v4-flash',
                    max_tokens: 16384,
                    messages: [{ role: 'user', content: fullQuery }],
                    tools: [{ type: 'web_search_20250305', name: 'web_search' }]
                })
            });

            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                if (attempt < 1) {
                    await sleep(2000);
                    continue;
                }
                console.error(`webSearch HTTP ${resp.status}: ${errText.slice(0, 200)}`);
                return '';
            }

            const data = (await resp.json()) as any;

            // 打印 token 消耗（DeepSeek Anthropic 兼容端点返回 usage）
            const usage = data?.usage;
            if (usage) {
                const inTokens = usage.input_tokens ?? usage.inputTokens ?? 0;
                const outTokens = usage.output_tokens ?? usage.outputTokens ?? 0;
                totalPromptTokens += inTokens;
                totalCompletionTokens += outTokens;
                console.log(`  [token] webSearch: ${inTokens} in / ${outTokens} out`);
            }

            const parts: string[] = [];
            for (const block of data.content ?? []) {
                if (block.type === 'text' && block.text) {
                    parts.push(block.text);
                } else if (block.type === 'tool_use') {
                    parts.push(`[搜索: ${block.name ?? ''}]`);
                }
            }
            return parts.join('\n');
        } catch (e) {
            if (attempt < 1) {
                await sleep(2000);
                continue;
            }
            console.error(`webSearch failed: ${e}`);
            return '';
        }
    }
    return '';
}

/**
 * 异步延时工具函数
 *
 * @param ms - 延时的毫秒数
 */
function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}
