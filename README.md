# 每日信息差 -- Next.js 版

AI 驱动的每日新闻简报：自动拆解搜索词库 -> 并发联网搜索 -> 智能过滤排序 -> 静态页面展示。
全程零服务器成本，基于 GitHub Pages 免费托管。

## 架构概览

```
                                ┌──────────────────────┐
                                │   GitHub Actions     │
                                │   (CI/CD 自动化)      │
                                │                      │
                                │  定时/手动 -> 搜索+打包 │
                                │  push MD  -> 仅打包   │
                                └────────┬─────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
           ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
           │  scripts/     │    │  src/        │    │  content/    │
           │  AI 生成脚本   │───>│  Next.js     │───>│  MD 报告     │
           │  (TS + AI SDK)│    │  (React SPA) │    │  (Git 版本化) │
           └──────────────┘    └──────┬───────┘    └──────────────┘
                                      │
                                      │ next build (static export)
                                      ▼
                               ┌──────────────┐
                               │  out/        │
                               │  纯静态站点   │
                               │  HTML+CSS+JS │
                               └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │  GitHub Pages│
                               │  (免费托管)   │
                               └──────────────┘
```

## 项目结构

```
NextDaily/
├── scripts/                          # AI 生成脚本（独立于 Next.js）
│   ├── generate.ts                   #   CLI 入口
│   ├── ai-client.ts                  #   统一 AI 客户端 (Vercel AI SDK)
│   ├── pipeline.ts                   #   四阶段流水线编排
│   ├── search-engine.ts              #   并发搜索执行器
│   ├── prompts.ts                    #   提示词加载器
│   ├── prompts/                      #   提示词模板
│   │   ├── keyword-generation.md     #     Stage 1: 主题 -> 词库矩阵
│   │   └── filter-sort.md            #     Stage 3: 过滤 + 排序
│   └── trigger-deploy.js             #   远程触发 GitHub Actions
│
├── content/                          # 每日 MD 报告（Git 追踪）
│   ├── 2026-07-06.md                 #     默认热点新闻
│   └── 2026-07-14-xin-neng-yuan-che.md  #  按主题的报告
│
├── src/                              # Next.js 前端
│   ├── app/
│   │   ├── layout.tsx                #     根布局 (Header + Footer + 暗色)
│   │   ├── page.tsx                  #     首页归档列表
│   │   ├── globals.css               #     全局样式
│   │   └── report/[slug]/page.tsx    #     报告详情页
│   ├── components/
│   │   ├── ui/                       #     通用 UI 组件
│   │   ├── archive/                  #     归档相关组件
│   │   └── report/                   #     报告详情组件
│   └── lib/
│       ├── types.ts                  #     类型定义
│       └── report-utils.ts           #     MD 解析 + 数据查询
│
├── .github/workflows/deploy.yml      # CI/CD 自动部署
├── next.config.ts                    #    Next.js 配置 (static export)
├── tailwind.config.ts                #    Tailwind CSS 配置
└── .env.local                        #    本地环境变量
```

## 工作流

| 场景 | 触发方式 | 行为 |
|------|---------|------|
| 每天 6:00 AM | GitHub Actions `schedule` | 搜索 -> 生成 MD -> 构建 -> 部署 |
| 本地主题搜索 | `npm run generate -- --topic "xxx"` | 搜索 -> 生成 MD（本地不部署） |
| 本地搜索+构建 | `npm run generate:build -- --topic "xxx"` | 搜索 -> 生成 MD -> 构建到 out/ |
| 远程触发 | `npm run deploy "主题"` | 触发 GitHub Actions -> 搜索 -> 构建 -> 部署 |
| 推送 MD 文件 | `git push`（仅 content/*.md 变更） | 跳过搜索 -> 构建 -> 部署 |

## 快速开始

### 1. 环境要求

- **Node.js** >= 20
- **npm** >= 10

### 2. 安装

```bash
cd D:\aProject\Node\NextDaily
npm install
```

### 3. 配置 API Key

```bash
# .env.local 已包含模板，按需修改
# DeepSeek: https://platform.deepseek.com
# OpenAI:   https://platform.openai.com

echo "AI_API_KEY=sk-xxx" > .env.local
```

### 4. 生成报告

```bash
# 默认热点新闻
npm run generate

# 指定主题
npx tsx scripts/generate.ts --topic "新能源车"

# 手动指定搜索词组（逗号分隔不同搜索方向）
npx tsx scripts/generate.ts --direct "AI政策, 芯片产业, 美联储"

# 搜索 + 构建
npm run generate:build -- --topic "二次元"
```

### 5. 本地开发

```bash
npm run dev           # 启动开发服务器 http://localhost:3000
npm run build         # 构建静态站点 -> out/
npx serve out/        # 预览静态站点
```

### 6. 触发云端部署

```bash
# 首次使用需配置 GitHub Token
echo "GITHUB_TOKEN=ghp_你的token" >> .env.local

npm run deploy                    # 默认热点
npm run deploy "新能源车"          # 携带主题
```

## 部署到 GitHub Pages

### 首次设置

1. Fork/创建仓库 `imtwa/NextDaily`（或你的仓库名）
2. 设置 GitHub Secrets: `AI_API_KEY` 填入 DeepSeek API Key
3. 启用 GitHub Pages: Settings -> Pages -> Source: `gh-pages` branch -> Save
4. 修改 CI 中的 basePath（如果你的仓库名不是 `NextDaily`）:
   - 编辑 `.github/workflows/deploy.yml`
   - 将 `NEXT_PUBLIC_BASE_PATH: /NextDaily` 改为你的仓库名
5. Push 到 main 分支 -- 自动触发首次部署

### 之后每次

- 每天 6:00 AM 自动生成并部署
- 本地 `npm run deploy` 远程触发
- Push 代码变更自动部署

## 切换 AI 供应商

编辑 `scripts/ai-client.ts`:

```ts
// DeepSeek -> OpenAI 示例
import { createOpenAI } from '@ai-sdk/openai';

const provider = createOpenAI({
    apiKey: process.env.AI_API_KEY
});

const chatModel = provider('gpt-4o-mini');  // 改模型名
```

注意: 联网搜索 (`webSearch`) 是 DeepSeek 独有功能，切换供应商后需替换实现。

## 技术栈

| 类别 | 选择 | 版本 |
|------|------|------|
| 框架 | Next.js (Static Export) | 16.2 |
| 语言 | TypeScript | 5.7 |
| 样式 | Tailwind CSS + Typography | 3.4 |
| AI SDK | Vercel AI SDK + @ai-sdk/deepseek | 4.x |
| Markdown | gray-matter + react-markdown | 9.x |
| 图标 | lucide-react | 0.468 |
| 暗色模式 | next-themes | 0.4 |
| 脚本运行 | tsx | 4.x |

## 静态导出说明

构建产物 `out/` 为纯静态文件（HTML + CSS + JS），不包含:

- 服务端 API 路由
- 数据库连接
- 运行时 AI 调用
- Node.js 依赖

所有数据在构建时预渲染为 HTML，浏览器端仅进行客户端搜索/过滤/暗色切换等纯前端操作。
