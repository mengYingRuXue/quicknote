# QuickNote

基于 Monorepo 架构的全栈笔记应用。支持用户认证、Markdown 编辑、自动保存、笔记分享等功能，采用现代前端技术栈构建。

## 技术栈

| 类别 | 技术 |
|------|------|
| 包管理 | pnpm |
| 构建编排 | Turborepo |
| Web 应用 | Next.js 15 |
| 阅读器应用 | Vite 6 |
| UI 框架 | React 18 |
| 类型系统 | TypeScript 5 |
| 样式方案 | Tailwind CSS |
| 组件库 | shadcn/ui |
| 后端服务 | Supabase |
| CI/CD | GitHub Actions |
| Web 部署 | Vercel |
| 阅读器部署 | GitHub Pages |

## 项目结构

```
quicknote/
├── apps/
│   ├── web/                # Next.js 主应用（认证、仪表盘、笔记编辑）
│   └── reader/             # Vite 阅读器应用（公开笔记只读访问）
├── packages/
│   ├── types/              # 共享 TypeScript 类型定义
│   ├── shared/             # 共享工具函数与 Supabase 客户端
│   └── ui/                 # 共享 UI 组件库
├── supabase/
│   └── schema.sql          # 数据库表结构与 RLS 策略
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI：lint、类型检查、构建
│       ├── deploy-web.yml      # 部署 Web 到 Vercel
│       └── deploy-reader.yml   # 部署 Reader 到 GitHub Pages
├── turbo.json              # Turborepo 任务配置
├── pnpm-workspace.yaml     # pnpm 工作区配置
└── package.json            # 根 package.json
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 在 SQL Editor 中执行 `supabase/schema.sql` 创建表结构
3. 从项目设置中获取 `Project URL` 和 `anon public` Key

### 3. 设置环境变量

Web 应用（`apps/web/.env.local`）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Reader 应用（`apps/reader/.env`）：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 启动开发服务器

```bash
pnpm dev
```

Turborepo 会同时启动所有应用的开发服务器。

## 功能特性

- **用户认证** — 基于 Supabase Auth 的注册、登录、登出
- **Markdown 编辑** — 实时 Markdown 编辑与预览
- **自动保存** — 编辑内容自动保存，防止数据丢失
- **笔记分享** — 将笔记设为公开，通过 Reader 应用分享
- **响应式设计** — 适配桌面端与移动端
- **深色模式** — 支持亮色/暗色主题切换

## 部署

详细的部署指南请参阅 [DEPLOYMENT.md](./DEPLOYMENT.md)。
