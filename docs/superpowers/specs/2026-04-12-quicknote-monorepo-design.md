# QuickNote - 全栈 Monorepo 笔记应用设计文档

**日期**: 2026-04-12  
**项目目标**: 使用 monorepo + pnpm + turborepo + Supabase + Next.js + shadcn + tailwind + React + Vite 搭建一个全栈项目，展示技术栈集成能力，并通过 GitHub CI/CD 自动部署。

---

## 项目概述

**QuickNote** 是一个简化版的笔记应用，核心功能包括：
- 用户认证（Supabase Auth）
- Markdown 笔记的创建、编辑、管理
- 笔记分享功能（生成公开链接）
- 两个独立应用：Next.js 主应用 + Vite 分享阅读器

项目采用 monorepo 架构，包含 2 个应用和 3 个共享包，通过 turborepo 管理构建流程，使用 pnpm workspace 管理依赖。

---

## Monorepo 结构

```
quicknote/
├── apps/
│   ├── web/                  # Next.js 15 主应用（笔记编辑、登录、管理）
│   └── reader/               # Vite + React 应用（公开笔记只读阅读器）
├── packages/
│   ├── ui/                   # 共享 UI 组件库（shadcn + tailwind 封装）
│   ├── shared/               # 共享工具函数（日期格式化、Markdown 解析等）
│   └── types/                # 共享 TypeScript 类型定义
├── turbo.json                # Turborepo 管道配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
├── package.json              # 根 package.json
├── .github/
│   └── workflows/
│       ├── ci.yml            # CI：lint + type-check + build
│       ├── deploy-web.yml    # CD：Next.js → Vercel
│       └── deploy-reader.yml # CD：Vite → GitHub Pages
└── README.md
```

### 各包职责

| 包 | 技术栈 | 职责 |
|---|--------|------|
| `apps/web` | Next.js 15 + App Router + Supabase | 用户认证、笔记 CRUD、Markdown 编辑器、生成分享链接 |
| `apps/reader` | Vite + React + Supabase JS Client | 纯静态 SPA，通过 URL 参数读取公开笔记并渲染 |
| `packages/ui` | React + shadcn/ui + Tailwind CSS | 封装的 UI 组件（Button、Card、NoteCard、MarkdownRenderer 等） |
| `packages/shared` | TypeScript | 工具函数（Markdown 转 HTML、日期格式化、Supabase client 工厂） |
| `packages/types` | TypeScript | 共享类型定义（Note、User、ShareLink 接口） |

---

## 数据模型与 Supabase

### 数据库表结构

```sql
-- 用户扩展表（Supabase Auth 自动管理 auth.users，我们扩展 profiles）
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- 笔记表
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default '无标题',
  content text not null default '',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 分享链接表
create table share_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade not null,
  slug text unique not null,          -- 短链接标识，如 "abc123"
  expires_at timestamptz,             -- 可选过期时间
  created_at timestamptz default now()
);
```

### RLS（Row Level Security）策略

- **profiles**: 用户只能读写自己的 profile
- **notes**: 
  - 用户只能 CRUD 自己的笔记
  - `is_public = true` 的笔记任何人可读
- **share_links**: 
  - 用户只能管理自己笔记的分享链接
  - 任何人可通过 slug 读取

### Supabase 功能使用

| 功能 | 用途 |
|------|------|
| Auth | 邮箱/密码登录注册，可选 GitHub OAuth |
| Database | PostgreSQL 存储笔记数据 |
| RLS | 行级安全策略，保护数据访问 |
| Realtime | 笔记列表实时更新（可选，展示技术能力） |

### 数据流

```
apps/web (Next.js)                    apps/reader (Vite)
    │                                      │
    ├── Supabase Auth (登录/注册)            │
    ├── CRUD notes (通过 RLS)               │
    ├── 创建 share_link                     │
    │                                      │
    │   用户分享链接 ──────────────────────→  │
    │                                      ├── 通过 slug 查询 share_links
    │                                      ├── 获取对应 note (is_public)
    │                                      └── 渲染 Markdown 内容
```

---

## 核心功能与技术实现

### apps/web (Next.js) 核心功能

#### 1. 认证流程
- **路由**: `/login` 和 `/signup`
- **实现**: 使用 Supabase Auth SDK
- **中间件**: 保护私有路由（`/dashboard`、`/notes/*`）
- **Session 管理**: 通过 Supabase SSR helpers

#### 2. 笔记管理
- **`/dashboard`**: 笔记列表（卡片视图），支持搜索和筛选
- **`/notes/new`**: 创建新笔记
- **`/notes/[id]`**: 编辑笔记
  - Markdown 编辑器（使用 `react-markdown` + `react-simplemde-editor` 或类似库）
  - 实时保存（防抖 500ms 自动保存到 Supabase）
- **CRUD 操作**: 通过 Supabase JS Client + RLS 策略

#### 3. 分享功能
- 笔记详情页有"生成分享链接"按钮
- 创建 `share_links` 记录，生成唯一 slug（使用 `nanoid` 或类似库）
- 复制链接格式：`https://<reader-domain>/?note=<slug>`

#### 4. UI 组件
- 使用 `packages/ui` 中的 shadcn 组件
- 响应式布局（移动端友好）
- 主题：支持亮色/暗色模式（通过 `next-themes`）

### apps/reader (Vite React) 核心功能

#### 1. 单一职责
- 纯静态 SPA，通过 URL 参数 `?note=<slug>` 获取笔记 ID
- 调用 Supabase JS Client 查询 `share_links` 和 `notes`
- 渲染 Markdown 内容（使用 `react-markdown` + `remark-gfm`）

#### 2. 样式
- 使用 `packages/ui` 中的组件保持一致性
- 简洁的阅读体验（类似 Medium 风格）
- 响应式设计

#### 3. 错误处理
- 笔记不存在 → 显示 404 页面
- 笔记已过期 → 显示过期提示
- 笔记未公开 → 显示权限错误

### packages/ui 组件示例

基于 shadcn/ui 封装的组件：
- `Button`、`Input`、`Card`、`Dialog`、`Textarea`
- `NoteCard` — 笔记卡片组件（标题、预览、时间戳）
- `MarkdownRenderer` — Markdown 渲染组件（统一样式）
- `Layout` — 通用布局组件（Header + 内容区）
- `AuthForm` — 登录/注册表单组件

**技术栈**:
- React 18
- Tailwind CSS
- shadcn/ui（通过 CLI 安装组件）
- TypeScript

### packages/shared 工具函数

```typescript
// markdown.ts
export function parseMarkdown(content: string): string;
export function extractPreview(content: string, maxLength: number): string;

// date.ts
export function formatDate(date: Date | string): string;
export function formatRelativeTime(date: Date | string): string;

// supabase.ts
export function createSupabaseClient(options?: {...}): SupabaseClient;

// slug.ts
export function generateSlug(): string;
```

### packages/types 类型定义

```typescript
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  note_id: string;
  slug: string;
  expires_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'id' | 'created_at'>; Update: Partial<Profile> };
      notes: { Row: Note; Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Note> };
      share_links: { Row: ShareLink; Insert: Omit<ShareLink, 'id' | 'created_at'>; Update: Partial<ShareLink> };
    };
  };
}
```

---

## Turborepo 配置

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**说明**:
- `^build` 确保依赖包先构建，再构建应用
- `outputs` 指定缓存目录
- `dev` 任务不缓存，因为是持久化进程

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## CI/CD 与部署

### GitHub Actions 工作流

#### CI 流程 (`ci.yml`)

触发条件：所有 PR 和 push 到 main 分支

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint
      - run: pnpm turbo type-check
      - run: pnpm turbo build
```

#### CD 流程 1: Next.js 部署到 Vercel (`deploy-web.yml`)

**推荐方式**: 使用 Vercel GitHub Integration（自动部署）

**手动方式**:
```yaml
name: Deploy Web to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=web
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
```

#### CD 流程 2: Vite 应用部署到 GitHub Pages (`deploy-reader.yml`)

触发条件：push 到 main 分支

```yaml
name: Deploy Reader to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build --filter=reader
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./apps/reader/dist
      - uses: actions/deploy-pages@v4
```

### 环境变量管理

#### apps/web/.env.local (Next.js)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

#### apps/reader/.env (Vite)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

#### GitHub Secrets
需要在 GitHub 仓库设置中添加：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`（如果使用手动部署）
- `VERCEL_ORG_ID`（如果使用手动部署）
- `VERCEL_PROJECT_ID`（如果使用手动部署）

### 部署拓扑

```
GitHub Push (main)
    │
    ├──→ CI: lint + type-check + build (全部通过后)
    │         │
    │         ├──→ Vercel Auto-Deploy (apps/web)
    │         │     → https://quicknote.vercel.app
    │         │
    │         └──→ GitHub Pages Deploy (apps/reader)
    │               → https://<username>.github.io/quicknote/
    │
    └──→ Supabase (已独立部署，不在 CI/CD 中)
```

---

## 技术栈总结

| 技术 | 用途 | 位置 |
|------|------|------|
| **pnpm** | 包管理器 | 全局 |
| **Turborepo** | Monorepo 构建工具 | 根目录 |
| **Next.js 15** | 主应用框架（SSR + API Routes） | apps/web |
| **Vite** | 构建工具（Vite React SPA） | apps/reader |
| **React 18** | UI 框架 | apps/web, apps/reader, packages/ui |
| **TypeScript** | 类型系统 | 全局 |
| **Tailwind CSS** | 样式框架 | apps/web, apps/reader, packages/ui |
| **shadcn/ui** | UI 组件库 | packages/ui |
| **Supabase** | 后端服务（Auth + Database + RLS） | apps/web, apps/reader |
| **react-markdown** | Markdown 渲染 | packages/ui |
| **GitHub Actions** | CI/CD | .github/workflows |
| **Vercel** | Next.js 部署平台 | apps/web |
| **GitHub Pages** | 静态站点部署 | apps/reader |

---

## 实现优先级

### Phase 1: 基础架构搭建
1. 初始化 monorepo（pnpm + turborepo）
2. 创建 5 个包的基础结构
3. 配置 TypeScript、ESLint、Prettier
4. 配置 Tailwind CSS

### Phase 2: Supabase 设置
1. 创建 Supabase 项目
2. 创建数据库表和 RLS 策略
3. 配置 Auth 提供商

### Phase 3: 共享包开发
1. `packages/types` — 定义所有类型
2. `packages/shared` — 实现工具函数
3. `packages/ui` — 封装 shadcn 组件

### Phase 4: apps/web 开发
1. 认证流程（登录/注册）
2. 笔记 CRUD 功能
3. Markdown 编辑器集成
4. 分享链接生成

### Phase 5: apps/reader 开发
1. 路由和参数解析
2. Supabase 数据获取
3. Markdown 渲染
4. 错误处理

### Phase 6: CI/CD 配置
1. 配置 GitHub Actions CI
2. 配置 Vercel 部署
3. 配置 GitHub Pages 部署
4. 测试完整流程

---

## 成功标准

1. ✅ Monorepo 结构清晰，包之间依赖关系正确
2. ✅ Turborepo 构建缓存生效，构建速度快
3. ✅ 两个应用都能独立运行和部署
4. ✅ 共享包被正确引用，无重复代码
5. ✅ Supabase Auth 和 RLS 正常工作
6. ✅ CI/CD 流程自动化，push 后自动部署
7. ✅ 代码通过 lint 和 type-check
8. ✅ 响应式设计，移动端体验良好

---

## 潜在风险与解决方案

| 风险 | 解决方案 |
|------|----------|
| Turborepo 缓存配置错误 | 仔细配置 `outputs`，测试缓存命中率 |
| Supabase RLS 策略配置错误 | 先在 Supabase Dashboard 测试策略，再集成到代码 |
| GitHub Pages 部署路径问题 | 配置 Vite `base` 选项为仓库名 |
| 环境变量泄露 | 使用 GitHub Secrets，不提交 `.env` 文件 |
| 包版本冲突 | 使用 pnpm 的 `overrides` 字段统一版本 |

---

## 参考资源

- [Turborepo 官方文档](https://turbo.build/repo/docs)
- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 15 文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Vite 文档](https://vitejs.dev/)
