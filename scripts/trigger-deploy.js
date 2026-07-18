#!/usr/bin/env node
/**
 * GitHub Actions 远程触发脚本
 *
 * 从本地通过 GitHub API 触发云端的 "Deploy to GitHub Pages" workflow。
 *
 * 用法:
 *   node scripts/trigger-deploy.js                 # 默认A股消息
 *   node scripts/trigger-deploy.js "新能源车"       # 携带搜索主题
 *   npm run deploy                                 # 快捷命令
 *   npm run deploy "AI芯片"                        # 携带主题的快捷命令
 *
 * 前提: 需要 GitHub Personal Access Token (classic)，勾选 workflow 权限。
 *   获取: https://github.com/settings/tokens
 *   配置: echo "GITHUB_TOKEN=ghp_xxx" >> .env.local
 *   或:   export GITHUB_TOKEN="ghp_xxx"
 */

// 按 Next.js 顺序加载所有 .env 文件（.env → .env.local → .env.{NODE_ENV} → .env.{NODE_ENV}.local）
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const projectRoot = path.join(__dirname, '..');
const NODE_ENV = process.env.NODE_ENV || 'development';
[path.join(projectRoot, '.env'),
    path.join(projectRoot, '.env.local'),
    path.join(projectRoot, `.env.${NODE_ENV}`),
    path.join(projectRoot, `.env.${NODE_ENV}.local`)]
    .filter((p, i, arr) => arr.indexOf(p) === i)  // 去重
    .forEach(p => { if (fs.existsSync(p)) dotenv.config({ path: p, override: true }); });

const OWNER = 'imtwa';
const REPO = 'NextDaily';
const TOPIC = process.argv[2] || '';

// -------- 解析 Token --------

/**
 * 读取 GITHUB_TOKEN（dotenv 已在顶部加载所有 .env* 文件）
 *
 * @returns Token 字符串，未找到时返回 null
 */
function getToken() {
    return process.env.GITHUB_TOKEN || null;
}

const GITHUB_TOKEN = getToken();

if (!GITHUB_TOKEN) {
    console.log('[ERROR] GITHUB_TOKEN 未设置。');
    console.log('');
    console.log('请选择以下方式之一配置:');
    console.log('  1. 环境变量: export GITHUB_TOKEN="ghp_xxx"');
    console.log('  2. 写入 .env.local: echo GITHUB_TOKEN=ghp_xxx >> .env.local');
    console.log('');
    console.log('获取 Token: https://github.com/settings/tokens');
    console.log('  需要勾选 workflow 权限');
    process.exit(1);
}

// -------- 构建请求 --------

const DEPLOY_ONLY = process.argv.includes('--deploy-only');

const payload = {
    ref: 'master',
    inputs: {}
};

if (TOPIC) payload.inputs.topic = TOPIC;
if (DEPLOY_ONLY) payload.inputs.deploy_only = 'true';

if (DEPLOY_ONLY) {
    console.log(`触发仅部署 | 仓库: ${OWNER}/${REPO}`);
} else if (TOPIC) {
    console.log(`触发云端构建 | 仓库: ${OWNER}/${REPO} | 主题: ${TOPIC}`);
} else {
    console.log(`触发云端构建 | 仓库: ${OWNER}/${REPO} | 模式: 默认A股消息`);
}

// -------- 调用 API --------

const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/deploy.yml/dispatches`;

fetch(url, {
    method: 'POST',
    headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
})
    .then(res => {
        if (res.status === 204) {
            console.log('[OK] 触发成功！查看进度:');
            console.log(`  https://github.com/${OWNER}/${REPO}/actions`);
        } else {
            return res.text().then(body => {
                console.log(`[ERR] 触发失败 (HTTP ${res.status})`);
                console.log(`  ${body.slice(0, 200)}`);
                console.log('  请检查:');
                console.log('  - Token 是否有效且勾选了 workflow 权限');
                console.log(`  - 仓库名是否正确: ${OWNER}/${REPO}`);
            });
        }
    })
    .catch(err => {
        console.log(`[ERR] 网络错误: ${err.message}`);
    });
