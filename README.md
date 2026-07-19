# 每日信息差 (NextDaily)

自动搜集 A 股市场最新消息，AI 过滤排序，生成每日信息差报告和抖音发布素材。

## 项目主旨

面向信息差类自媒体博主，提供从信息搜集到内容发布的**全自动化工具链**：

- AI 联网搜索 A 股市场关键消息
- 智能去重、过滤、排序（每次 10~12 条精选）
- 生成 Markdown 报告 + 可复制发布文案（含话题标签）
- 生成 1080x1350 竖版卡片图片（浏览器端 Canvas，一键下载）
- 静态网站展示归档 + GitHub Pages 自动部署

## 技术架构

```
搜索词库生成 → 5 路并发搜索 → AI 过滤排序 → 格式化报告 → 静态网站构建
                                                         → 卡片图片（浏览器端 Canvas）
```

### 四阶段流水线

| 阶段 | 模块 | 说明 |
|------|------|------|
| Stage 1 | `pipeline.ts` | 根据主题（或默认词库）生成 5 组搜索关键词 |
| Stage 2 | `search-engine.ts` + `ai-client.ts` | 5 路并发调用 DeepSeek 联网搜索 |
| Stage 3 | `pipeline.ts` + `filter-sort.md` | AI 提取、去重、排序，输出 10~12 条 JSON |
| Stage 4 | `search-engine.ts` | 格式化 Markdown 报告，写入 `content/` 目录 |

### AI 供应商

当前使用 DeepSeek (`deepseek-v4-flash`)，通过 Vercel AI SDK 调用。
切换供应商只需修改 `scripts/ai-client.ts` 中的 provider 创建逻辑。

### 图片生成

卡片图片在**浏览器端**渲染，不产生本地文件：

- 预览：服务端生成纯 HTML/CSS 卡片（零 hydration 风险，不依赖 React）
- 下载：原生 JS `onclick` 读取 DOM 数据属性，Canvas 绘制 1080x1350 PNG
- 批量下载：顺序触发所有下载按钮

### GitHub Pages 部署

`.github/workflows/deploy.yml` 实现全自动部署：

- 每天北京时间 6:00 自动运行
- 支持手动触发（可指定主题）
- 备份 `content/` 和 `out/` → 切到 `gh-pages` 分支 → 拷回 → 增量提交
- **不携带 `node_modules`**，只部署构建产物和报告归档

## 项目结构

```
NextDaily/
├── .github/workflows/
│   └── deploy.yml               # GitHub Pages 自动部署
├── scripts/                     # 生成流水线
│   ├── generate.ts              # CLI 入口
│   ├── generate-and-build.js    # 一键生成 + 构建
│   ├── pipeline.ts              # 四阶段流水线编排
│   ├── search-engine.ts         # 并发搜索 + 报告格式化
│   ├── ai-client.ts             # AI 客户端（token 统计、北京时间）
│   ├── prompts.ts               # 提示词加载
│   ├── trigger-deploy.js        # 远程触发 GitHub Actions
│   └── prompts/
│       ├── filter-sort.md       # Stage 3 过滤排序提示词（10~12 条）
│       └── keyword-generation.md # Stage 1 关键词生成提示词
├── src/
│   ├── app/
│   │   ├── page.tsx             # 首页（报告归档列表）
│   │   └── report/[slug]/page.tsx  # 报告详情页
│   ├── components/
│   │   ├── archive/             # 归档组件（列表、侧边栏）
│   │   ├── card/                # 卡片预览（纯 HTML + 原生 JS 下载）
│   │   ├── report/              # 报告组件（文案复制、原始结果、搜索词库）
│   │   └── ui/                  # 通用 UI（页头、页脚）
│   └── lib/                     # 工具库（报告解析、条目解析、类型定义）
├── content/                     # 生成的 Markdown 报告（Git 追踪，增量归档）
├── public/fonts/                # 字体文件（卡片下载 Canvas 用）
└── out/                         # Next.js 静态导出（构建产物）
```

## 快速开始

### 1. 环境准备

```bash
# Node.js >= 20
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

执行流程：
1. 四阶段流水线 → 报告写入 `content/`
2. Next.js 静态构建 → 产物写入 `out/`
3. 卡片图片在浏览器端预览和下载

### 4. 按主题生成

```bash
pnpm generate:build "新能源"
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
| `GITHUB_TOKEN` | GitHub Token（远程触发部署用） | 否 |

## 发布流程

1. 运行 `pnpm generate:build`（或等 GitHub Actions 自动运行）
2. 打开 `out/report/2026-07-18.html`（或线上 `https://imtwa.github.io/NextDaily/report/2026-07-18.html`）
3. 在「发布文案」区点击「一键复制」，粘贴到抖音
4. 在「卡片预览」区逐张下载 PNG，上传抖音轮播帖
5. 发布

## 自定义

### 修改默认搜索词库

编辑 `scripts/pipeline.ts` 中的 `defaultKeywordMatrix()` 函数。

默认搜索覆盖四大维度：

1. **宏观与政策** — 国内经济政策、货币政策、产业政策、监管新规
2. **财报与业绩** — 上市公司业绩预告、财报、分红回购、并购重组
3. **产业情报** — 重点行业供需变化、技术突破、竞争格局
4. **风险预警** — 解禁减持、融资余额、海外市场传导风险（含国际宏观补充）

### 修改卡片样式

编辑 `src/components/card/card-preview-section.tsx`：
- HTML 预览：`cardHtml()` 和 `coverHtml()` 函数
- 下载 PNG：`downloadScript` 中的 Canvas 绘图逻辑
- 色彩方案：`C` 常量对象

### 修改发布文案格式

编辑 `src/components/report/copy-text-section.tsx` 中的 `buildCopyText()` 和 `getTags()` 函数。

### 修改 AI 输出条数

编辑 `scripts/prompts/filter-sort.md`（提示词）和 `scripts/pipeline.ts`（fallback 降级上限）。

### 切换 AI 供应商

编辑 `scripts/ai-client.ts`，修改 provider 和 model 配置。

## 角色分工

这个项目有两套输出，不要搞混：

### 1. 卡片图片（用户看到的）

生成在 `out/report/` 下的 HTML 文件中的「卡片预览」区域，浏览器端 Canvas 渲染为 PNG 图片。

| 文件 | 作用 |
|------|------|
| `src/components/card/card-preview-section.tsx` | 卡片预览组件，包含封面图和逐条信息卡片的 HTML 结构 + Canvas 下载脚本 |
| `public/fonts/` | Canvas 绘制中文用到的字体文件 |

**封面图（cover）** 展示日期、主题和当天的完整信息差标题列表，字体放大，标题全部展示。
**逐条卡片** 每条信息差独立一张，含序号、标题和简述。

卡片图片才是最终用户看到的产出。封面图和逐条卡片一起组成抖音轮播帖。

### 2. 网页（操作者看的）

`out/index.html` 及其子页面是**归档和管理用途**，给发帖人自己看的：

| 页面 | 作用 |
|------|------|
| `out/index.html` | 归档首页，按月列出所有历史报告，方便回顾和检索 |
| `out/report/YYYY-MM-DD.html` | 单篇报告详情页，含文案复制、卡片预览下载、原始搜索记录 |

网页只是操作工具，不会公开发布。所有推给用户的内容都以卡片图片形式发出。
