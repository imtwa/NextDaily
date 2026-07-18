# 每日信息差 (NextDaily)

自动搜集 A 股市场最新消息，AI 过滤排序，生成每日信息差报告和抖音发布素材。

## 项目主旨

面向信息差类自媒体博主，提供从信息搜集到内容发布的**全自动化工具链**：
- AI 联网搜索 A 股市场关键消息
- 智能去重、过滤、排序
- 生成 Markdown 报告 + 可复制发布文案
- 生成 1080x1350 竖版卡片图片（可一键下载，适配抖音轮播帖）
- 静态网站展示归档

## 技术架构

```
搜索词库生成 → 5 路并发搜索 → AI 过滤排序 → 格式化报告 → 静态网站构建
                                                         → 卡片图片（浏览器端 Canvas）
```

### 四阶段流水线

| 阶段 | 模块 | 说明 |
|------|------|------|
| Stage 1 | `pipeline.ts` | 根据主题（或默认 A 股词库）生成 5 组搜索关键词 |
| Stage 2 | `search-engine.ts` + `ai-client.ts` | 5 路并发调用 DeepSeek 联网搜索 |
| Stage 3 | `pipeline.ts` | AI 从搜索结果中提取、去重、排序，输出 JSON |
| Stage 4 | `search-engine.ts` | 格式化 Markdown 报告，写入 `content/` 目录 |

### AI 供应商

当前使用 DeepSeek (`deepseek-v4-flash`)，通过 Vercel AI SDK 调用。
切换供应商只需修改 `scripts/ai-client.ts` 中的 provider 创建逻辑。

### 图片生成

卡片图片在**浏览器端**使用 Canvas 渲染，不产生本地文件：
- 预览：服务端生成纯 HTML/CSS 卡片（零 hydration 风险）
- 下载：原生 JS 读取 DOM 中的数据属性，在 Canvas 上绘制 1080x1350 PNG
- 批量下载：顺序触发所有下载按钮

## 项目结构

```
NextDaily/
├── scripts/                    # 生成流水线（Node.js 脚本）
│   ├── generate.ts             # CLI 入口
│   ├── generate-and-build.js   # 一键生成 + 构建
│   ├── pipeline.ts             # 四阶段流水线编排
│   ├── search-engine.ts        # 并发搜索 + 报告格式化
│   ├── ai-client.ts            # AI 客户端（DeepSeek）
│   ├── prompts.ts              # 提示词加载
│   └── prompts/
│       ├── filter-sort.md      # Stage 3 过滤排序提示词
│       └── keyword-generation.md # Stage 1 关键词生成提示词
├── src/
│   ├── app/
│   │   ├── page.tsx            # 首页（报告归档列表）
│   │   └── report/[slug]/page.tsx  # 报告详情页
│   ├── components/
│   │   ├── archive/            # 归档组件（列表、侧边栏）
│   │   ├── card/               # 卡片预览组件
│   │   ├── report/             # 报告组件（文案复制、原始结果、搜索词库）
│   │   └── ui/                 # 通用 UI（页头、页脚）
│   └── lib/                    # 工具库（报告解析、类型定义）
├── content/                    # 生成的 Markdown 报告
├── public/fonts/               # 字体文件（卡片下载用）
└── out/                        # 静态导出（构建产物）
```

## 快速开始

### 1. 环境准备

```bash
# Node.js >= 22
# 设置 AI API Key
export AI_API_KEY='sk-xxx'
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 一键生成 + 构建

```bash
pnpm generate:build
```

这个命令会：
1. 执行四阶段流水线，生成报告到 `content/`
2. 构建 Next.js 静态网站到 `out/`
3. 卡片图片在浏览器端预览和下载，不产生本地文件

### 4. 按主题生成

```bash
pnpm generate:build "新能源"
# 或
npx tsx scripts/generate.ts --topic "新能源"
```

### 5. 指定搜索词

```bash
npx tsx scripts/generate.ts --direct "AI政策, 芯片, 新能源"
```

### 6. 跳过 AI 过滤

```bash
npx tsx scripts/generate.ts --no-filter
```

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `AI_API_KEY` | DeepSeek API Key | 是 |

## 发布流程

1. 运行 `pnpm generate:build`
2. 打开 `out/report/2026-07-18.html`
3. 在「发布文案」区点击「一键复制」，粘贴到抖音
4. 在「卡片预览」区逐张下载 PNG，上传抖音轮播帖
5. 发布

## 自定义

### 修改默认搜索词库

编辑 `scripts/pipeline.ts` 中的 `defaultKeywordMatrix()` 函数。

### 修改卡片样式

编辑 `src/components/card/card-preview-section.tsx`：
- 卡片 HTML 预览：`cardHtml()` 和 `coverHtml()` 函数
- 下载 PNG 绘制：`downloadScript` 中的 Canvas 绘图逻辑

### 修改发布文案格式

编辑 `src/components/report/copy-text-section.tsx` 中的 `buildCopyText()` 函数。

### 切换 AI 供应商

编辑 `scripts/ai-client.ts`，修改 provider 和 model 配置。
