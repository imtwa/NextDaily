/**
 * 统一的环境变量加载 — 模拟 Next.js 加载顺序
 *
 * Next.js 按以下顺序加载 .env 文件（后加载的覆盖前面的）:
 *   1. .env                 — 所有环境的默认值
 *   2. .env.local           — 本地覆盖（git-ignored）
 *   3. .env.{NODE_ENV}      — 特定环境（如 .env.development）
 *   4. .env.{NODE_ENV}.local — 特定环境的本地覆盖（git-ignored）
 *
 * 参考: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 *
 * 用法:
 *   import './env';  // 在所有其他 import 之前
 */

import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

const projectRoot = path.resolve(__dirname, '..');

/**
 * 按 Next.js 顺序加载所有存在的 .env 文件
 */
function loadEnvFiles(): void {
    const nodeEnv = process.env.NODE_ENV || 'development';

    const candidates = [
        path.join(projectRoot, '.env'),
        path.join(projectRoot, '.env.local'),
        path.join(projectRoot, `.env.${nodeEnv}`),
        path.join(projectRoot, `.env.${nodeEnv}.local`),
    ];

    // 去重后按顺序加载（后面的覆盖前面的，dotenv 默认行为是不覆盖已存在的变量）
    // 所以改用 override: true 让后面的文件覆盖前面的
    const seen = new Set<string>();
    for (const filePath of candidates) {
        const normalized = path.normalize(filePath);
        if (seen.has(normalized)) continue;
        seen.add(normalized);

        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath, override: true });
        }
    }
}

loadEnvFiles();
