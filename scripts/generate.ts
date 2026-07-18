#!/usr/bin/env node
/**
 * 每日信息差报告生成器 — CLI 入口
 *
 * 用法:
 *   npx tsx scripts/generate.ts                      # 默认A股消息
 *   npx tsx scripts/generate.ts --topic "二次元"     # 按主题搜索
 *   npx tsx scripts/generate.ts --direct "AI政策, 芯片"  # 手动指定搜索词
 *   npx tsx scripts/generate.ts --no-filter          # 跳过 Stage 3 AI 过滤
 *
 * 输出: content/{date}.md 或 content/{date}-{topic}.md
 *
 * 环境变量:
 *   AI_API_KEY — DeepSeek / OpenAI 等 AI 供应商的 API Key
 */

import './env';  // 统一加载 .env* 文件（必须在其他 import 之前）
import path from 'node:path';
import { runPipeline } from './pipeline';
import { getBeijingNow } from './ai-client';

// ─── 参数解析 ───────────────────────────────────────────────────────────

/** CLI 解析结果 */
interface CliArgs {
    topic?: string | null;
    direct?: string | null;
    noFilter: boolean;
}

/**
 * 解析命令行参数
 *
 * 支持以下格式:
 *   --topic / -t "主题"    指定搜索主题
 *   --direct / -d "a, b"  手动指定搜索词组（逗号分隔为不同方向）
 *   --no-filter           跳过 AI 过滤排序
 *   位置参数              自动识别为主题
 *
 * @returns 解析后的参数对象
 */
function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    let topic: string | null = null;
    let direct: string | null = null;
    let noFilter = false;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--topic':
            case '-t':
                topic = args[++i] ?? null;
                break;
            case '--direct':
            case '-d':
                direct = args[++i] ?? null;
                break;
            case '--no-filter':
                noFilter = true;
                break;
            default:
                // 位置参数视为 topic（仅第一个非旗标参数生效）
                if (!topic && !args[i].startsWith('-')) {
                    topic = args[i];
                }
        }
    }

    // 环境变量兜底（用于 npm run generate:build 等链式命令）
    //   支持: TOPIC=xxx 或 npm 的 --topic=xxx 配置注入
    if (!topic && (process.env.TOPIC || process.env.npm_config_topic)) {
        topic = process.env.TOPIC || process.env.npm_config_topic!;
    }
    if (!noFilter && process.env.NO_FILTER === '1') {
        noFilter = true;
    }

    return { topic, direct, noFilter };
}

// ─── 主入口 ─────────────────────────────────────────────────────────────

/**
 * 主函数
 *
 * 解析 CLI 参数，调用完整四阶段流水线，输出报告到 content/ 目录。
 */
async function main() {
    const { topic, direct, noFilter } = parseArgs();

    // content/ 目录在项目根目录下
    const contentDir = path.resolve(__dirname, '..', 'content');

    console.log('='.repeat(50));
    console.log('  每日信息差搜集 - Next.js 版');
    console.log(
        `  时间: ${(() => { const d = getBeijingNow(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}`
    );
    if (topic) {
        console.log(`  主题: ${topic}`);
    } else {
        console.log('  模式: 默认A股消息');
    }
    console.log('  流程: 词库生成 → 并发搜索 → AI过滤排序');
    console.log('='.repeat(50));

    // 解析手动关键词
    let manualKeywords: string[][] | null = null;
    if (direct) {
        manualKeywords = direct
            .split(',')
            .map(group => group.trim().split(/\s+/).filter(k => k.length > 0))
            .filter(group => group.length > 0);

        if (!manualKeywords.length) {
            console.error('错误: --direct 参数后没有有效的搜索词');
            process.exit(1);
        }

        console.log(`手动指定 ${manualKeywords.length} 组搜索词`);
        manualKeywords.forEach((kw, i) => {
            console.log(`  ${i + 1}. ${kw.join(' ')}`);
        });
    }

    try {
        const result = await runPipeline(contentDir, {
            topic,
            manualKeywords,
            noFilter
        });

        console.log(`\n报告已保存: ${result.filePath}`);

        // 打印前 5 条预览
        if (result.items.length > 0) {
            console.log(`\n-- 信息差预览:`);
            for (let i = 0; i < Math.min(result.items.length, 5); i++) {
                console.log(`  • ${result.items[i].title}`);
                if (result.items[i].brief) {
                    console.log(`    ${result.items[i].brief.slice(0, 60)}`);
                }
            }
            if (result.items.length > 5) {
                console.log(`  ... 共 ${result.items.length} 条，详见报告`);
            }
        }

        console.log(`\n-- 完成!`);
    } catch (e) {
        console.error(`\n[ERROR] Pipeline 执行失败: ${e}`);
        process.exit(1);
    }
}

main();
