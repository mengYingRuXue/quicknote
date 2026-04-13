# 部署指南

本文档介绍如何将 QuickNote 的各个服务部署到生产环境。

## 1. Supabase 设置

### 1.1 创建项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard) 并登录
2. 点击 **New Project**，填写项目名称并选择数据库密码和区域
3. 等待项目初始化完成

### 1.2 初始化数据库

1. 进入项目的 **SQL Editor**
2. 将 `supabase/schema.sql` 的内容粘贴到编辑器中
3. 点击 **Run** 执行，创建 `profiles` 和 `notes` 表及 RLS 策略

### 1.3 获取凭证

进入 **Project Settings → API**，记录以下信息：

| 字段 | 用途 |
|------|------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL` |
| anon public Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` |

这些值将用于 Web 和 Reader 应用的环境变量配置。

## 2. Vercel 部署（Web 应用）

Web 应用（Next.js）部署到 Vercel，支持两种方式。

### 方式一：Vercel Dashboard

1. 登录 [Vercel](https://vercel.com)，点击 **Add New → Project**
2. 导入 GitHub 仓库
3. 配置构建设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm turbo build --filter=web`
   - **Install Command**: `cd ../.. && pnpm install`
4. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 点击 **Deploy**

### 方式二：GitHub Actions 自动部署

项目已配置 `.github/workflows/deploy-web.yml`，当 `main` 分支的 `apps/web/`、`packages/` 或 `pnpm-lock.yaml` 发生变更时自动触发。

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中添加：

| Secret | 说明 |
|--------|------|
| `VERCEL_TOKEN` | Vercel 个人访问令牌（在 Vercel Settings → Tokens 创建） |
| `VERCEL_ORG_ID` | Vercel 团队/个人 ID（在 Vercel Settings → General 查看） |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID（在项目 Settings → General 查看） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon Key |

推送到 `main` 分支后会自动构建并部署。

## 3. GitHub Pages 部署（Reader 应用）

Reader 应用（Vite）部署到 GitHub Pages。

### 3.1 配置 GitHub Secrets

在仓库 **Settings → Secrets and variables → Actions** 中添加：

| Secret | 说明 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon Key |

### 3.2 启用 GitHub Pages

1. 进入仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**

### 3.3 触发部署

推送到 `main` 分支且涉及 `apps/reader/`、`packages/` 或 `pnpm-lock.yaml` 的变更时，`.github/workflows/deploy-reader.yml` 会自动触发构建和部署。

## 4. Vite Base URL 配置

如果你的 GitHub Pages 部署在子路径下（例如 `https://username.github.io/repo-name/`），需要修改 `apps/reader/vite.config.ts` 中的 `base` 配置：

```ts
export default defineConfig({
  plugins: [react()],
  base: "/repo-name/",  // 替换为你的仓库名
});
```

如果使用自定义域名或部署在根路径，保持 `base: "/"` 即可。

## 5. 验证

部署完成后，按以下步骤验证：

1. **Web 应用**：访问 Vercel 分配的域名，测试注册、登录、创建笔记
2. **Reader 应用**：访问 GitHub Pages 地址，确认能加载公开笔记
3. **数据联通**：在 Web 应用中创建一条公开笔记，在 Reader 中确认可以访问

## 6. 故障排查

### Vercel 构建失败

- 检查 **Build Command** 和 **Root Directory** 配置是否正确
- 确认环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已设置
- 查看 Vercel 构建日志中的具体错误信息
- 确保 `pnpm-lock.yaml` 已提交到仓库

### GitHub Pages 404

- 确认 **Settings → Pages → Source** 已设置为 **GitHub Actions**
- 检查 `vite.config.ts` 中的 `base` 是否与实际部署路径匹配
- 查看 Actions 运行日志，确认 `upload-pages-artifact` 和 `deploy-pages` 步骤成功
- 如果使用子路径，确保应用内的路由也考虑了 base path

### Supabase 连接问题

- 确认 Supabase 项目处于活跃状态（免费项目闲置 7 天会暂停）
- 检查环境变量中的 URL 和 Key 是否正确（注意不要有多余空格）
- 确认 `schema.sql` 已成功执行，`profiles` 和 `notes` 表存在
- 检查 RLS 策略是否正确配置，可在 Supabase Dashboard 的 **Authentication → Policies** 中查看
