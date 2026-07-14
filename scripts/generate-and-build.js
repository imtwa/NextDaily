#!/usr/bin/env node
/**
 * generate + build 包装器
 *
 * 解决 npm 链式命令中位置参数无法穿透到 generate.ts 的问题。
 *
 * 用法:
 *   npm run generate:build                 # 默认热点
 *   npm run generate:build "英雄联盟"       # 按主题
 *   npm run generate:build -- --topic "英雄联盟"  # 显式参数
 */

const { execSync } = require('child_process');

// 收集所有参数（npm 会把 -- 后面的参数追加到这里）
const args = process.argv.slice(2);
const quoted = args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ');

console.log(`[generate:build] 参数: ${quoted || '(无)'}\n`);

// Step 1: 生成报告
execSync(`npx tsx scripts/generate.ts ${quoted}`, { stdio: 'inherit' });

// Step 2: 构建 Next.js（build 脚本自带 clean-out 清理）
execSync('npm run build', { stdio: 'inherit' });
