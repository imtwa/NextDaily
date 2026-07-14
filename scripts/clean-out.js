#!/usr/bin/env node
/**
 * 清理 out/ 目录中的 RSC 载荷文件
 *
 * 删除所有 .txt 文件和 _next.* / _not-found 子目录，
 * 保留 .html 文件和 _next/static/ 资源。
 */

const fs = require('fs');
const path = require('path');
const outDir = path.join(__dirname, '..', 'out');

if (!fs.existsSync(outDir)) {
    console.log('[clean-out] out/ 目录不存在，跳过');
    process.exit(0);
}

let deleted = 0;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // 删除 RSC 载荷目录
            if (entry.name === '_not-found' || entry.name.includes('_next.')) {
                fs.rmSync(fullPath, { recursive: true, force: true });
                deleted++;
            } else {
                walk(fullPath);
            }
        } else if (entry.isFile() && entry.name.endsWith('.txt')) {
            fs.unlinkSync(fullPath);
            deleted++;
        }
    }
}

// 清理空目录
function removeEmptyDirs(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            removeEmptyDirs(fullPath);
            try {
                const remaining = fs.readdirSync(fullPath);
                if (remaining.length === 0 && entry.name !== '_next' && entry.name !== 'static' && entry.name !== 'chunks') {
                    fs.rmdirSync(fullPath);
                    deleted++;
                }
            } catch {}
        }
    }
}

// 修复子目录 HTML 中的资源路径（assetPrefix: '.' 对子目录不生效）
function fixAssetPaths(dir, depth) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '_next') {
            fixAssetPaths(fullPath, depth + 1);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            let html = fs.readFileSync(fullPath, 'utf-8');
            const prefix = '../'.repeat(depth);
            // 将 ./_next/ 替换为正确深度的相对路径
            const fixed = html.replace(/\.\/_next\//g, prefix + '_next/');
            if (fixed !== html) {
                fs.writeFileSync(fullPath, fixed);
                deleted++;
            }
        }
    }
}

walk(outDir);
removeEmptyDirs(outDir);
fixAssetPaths(outDir, 0); // depth=0 的根 HTML 不需要改 (./_next/ 已正确)

if (deleted > 0) {
    console.log(`[clean-out] 已删除/修复 ${deleted} 个文件`);
} else {
    console.log('[clean-out] 无需清理');
}
