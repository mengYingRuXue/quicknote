# QuickNote Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack monorepo note-taking app (QuickNote) using pnpm + Turborepo + Supabase + Next.js + shadcn + Tailwind + React + Vite, deployed via GitHub CI/CD.

**Architecture:** Monorepo with 2 apps (Next.js main app, Vite reader SPA) and 3 shared packages (ui, shared, types). Supabase provides auth, database, and RLS. Next.js deploys to Vercel, Vite reader deploys to GitHub Pages.

**Tech Stack:** pnpm, Turborepo, Next.js 15 (App Router), Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, Supabase (@supabase/ssr, @supabase/supabase-js), GitHub Actions

---

## File Structure

```
quicknote/
├── package.json                          # Root package.json (workspaces, turbo scripts)
├── pnpm-workspace.yaml                   # pnpm workspace definition
├── turbo.json                            # Turborepo pipeline config
├── .gitignore                            # Global gitignore
├── .npmrc                                # pnpm config
├── README.md                             # Project README
│
├── packages/
│   ├── types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts                  # Note, Profile, ShareLink, Database types
│   │
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Re-exports
│   │       ├── supabase.ts               # createSupabaseClient factory
│   │       ├── date.ts                   # formatDate, formatRelativeTime
│   │       └── slug.ts                   # generateSlug
│   │
│   └── ui/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       └── src/
│           ├── index.ts                  # Re-exports all components
│           ├── globals.css               # Tailwind base + shadcn CSS variables
│           ├── lib/
│           │   └── utils.ts              # cn() utility (shadcn)
│           └── components/
│               ├── button.tsx
│               ├── input.tsx
│               ├── card.tsx
│               ├── dialog.tsx
│               ├── textarea.tsx
│               ├── note-card.tsx          # NoteCard composite component
│               └── markdown-renderer.tsx  # Markdown rendering component
│
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── .env.local.example
│   │   └── src/
│   │       ├── lib/
│   │       │   └── supabase/
│   │       │       ├── server.ts         # createServerClient helper
│   │       │       └── client.ts         # createBrowserClient helper
│   │       ├── middleware.ts             # Auth middleware (protect /dashboard, /notes)
│   │       └── app/
│   │           ├── layout.tsx            # Root layout
│   │           ├── page.tsx              # Landing / redirect to dashboard
│   │           ├── globals.css
│   │           ├── login/
│   │           │   └── page.tsx          # Login page
│   │           ├── signup/
│   │           │   └── page.tsx          # Signup page
│   │           ├── auth/
│   │           │   └── callback/
│   │           │       └── route.ts      # OAuth callback handler
│   │           ├── dashboard/
│   │           │   └── page.tsx          # Note list (cards)
│   │           └── notes/
│   │               ├── new/
│   │               │   └── page.tsx      # Create note
│   │               └── [id]/
│   │                   └── page.tsx      # Edit note + share
│   │
│   └── reader/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── index.html
│       ├── .env.example
│       └── src/
│           ├── main.tsx                  # React entry
│           ├── App.tsx                   # Router + note fetching
│           ├── globals.css
│           └── components/
│               ├── NoteView.tsx          # Render shared note
│               ├── NotFound.tsx          # 404 state
│               └── Loading.tsx           # Loading state
│
└── .github/
    └── workflows/
        ├── ci.yml                        # Lint + type-check + build
        ├── deploy-web.yml                # Next.js → Vercel
        └── deploy-reader.yml             # Vite → GitHub Pages
```

---

## Task 1: Initialize Monorepo Root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "quicknote",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\""
  },
  "devDependencies": {
    "turbo": "^2",
    "prettier": "^3",
    "typescript": "^5"
  },
  "packageManager": "pnpm@9.15.4"
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

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

- [ ] **Step 4: Create .gitignore**

```
node_modules
.next
dist
.env
.env.local
.turbo
*.tsbuildinfo
```

- [ ] **Step 5: Create .npmrc**

```
auto-install-peers=true
```

- [ ] **Step 6: Install dependencies and verify**

Run: `pnpm install`
Expected: lockfile created, turbo installed

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo with pnpm + turborepo"
```

---

## Task 2: Create packages/types

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@quicknote/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "echo 'no lint configured'"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts with all type definitions**

```typescript
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      notes: {
        Row: Note;
        Insert: Omit<Note, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Note, "id" | "user_id" | "created_at">>;
      };
      share_links: {
        Row: ShareLink;
        Insert: Omit<ShareLink, "id" | "created_at">;
        Update: Partial<Omit<ShareLink, "id" | "note_id">>;
      };
    };
  };
}
```

- [ ] **Step 4: Run type-check**

Run: `cd packages/types && pnpm type-check`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/types
git commit -m "feat: add shared types package (Note, Profile, ShareLink, Database)"
```

---

## Task 3: Create packages/shared

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/supabase.ts`
- Create: `packages/shared/src/date.ts`
- Create: `packages/shared/src/slug.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@quicknote/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "echo 'no lint configured'"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "@quicknote/types": "workspace:*",
    "nanoid": "^5"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/supabase.ts**

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@quicknote/types";

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
```

- [ ] **Step 4: Create src/date.ts**

```typescript
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  return formatDate(d);
}
```

- [ ] **Step 5: Create src/slug.ts**

```typescript
import { nanoid } from "nanoid";

export function generateSlug(): string {
  return nanoid(10);
}
```

- [ ] **Step 6: Create src/index.ts**

```typescript
export { createSupabaseClient } from "./supabase";
export { formatDate, formatRelativeTime } from "./date";
export { generateSlug } from "./slug";
```

- [ ] **Step 7: Install dependencies and type-check**

Run: `pnpm install && cd packages/shared && pnpm type-check`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared utilities package (supabase client, date, slug)"
```

---

## Task 4: Create packages/ui

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/tailwind.config.ts`
- Create: `packages/ui/postcss.config.js`
- Create: `packages/ui/src/globals.css`
- Create: `packages/ui/src/lib/utils.ts`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/components/button.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/textarea.tsx`
- Create: `packages/ui/src/components/dialog.tsx`
- Create: `packages/ui/src/components/note-card.tsx`
- Create: `packages/ui/src/components/markdown-renderer.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@quicknote/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "echo 'no lint configured'"
  },
  "dependencies": {
    "@quicknote/types": "workspace:*",
    "class-variance-authority": "^0.7",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "react-markdown": "^9",
    "remark-gfm": "^4",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "react": "^18",
    "react-dom": "^18",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8",
    "typescript": "^5"
  },
  "peerDependencies": {
    "react": "^18",
    "react-dom": "^18"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 4: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create src/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 6: Create src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Create src/components/button.tsx**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 8: Create src/components/input.tsx**

```tsx
import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 9: Create src/components/card.tsx**

```tsx
import * as React from "react";
import { cn } from "../lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 10: Create src/components/textarea.tsx**

```tsx
import * as React from "react";
import { cn } from "../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 11: Create src/components/note-card.tsx**

```tsx
import * as React from "react";
import type { Note } from "@quicknote/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const preview = note.content.length > 100
    ? note.content.slice(0, 100) + "..."
    : note.content;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="text-lg">{note.title}</CardTitle>
        <CardDescription>
          {new Date(note.updated_at).toLocaleDateString("zh-CN")}
          {note.is_public && (
            <span className="ml-2 text-xs text-green-600">公开</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{preview}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 12: Create src/components/markdown-renderer.tsx**

```tsx
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-neutral dark:prose-invert max-w-none"
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 13: Create src/index.ts (re-exports)**

```typescript
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Input, type InputProps } from "./components/input";
export {
  Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent,
} from "./components/card";
export { Textarea, type TextareaProps } from "./components/textarea";
export { NoteCard } from "./components/note-card";
export { MarkdownRenderer } from "./components/markdown-renderer";
export { cn } from "./lib/utils";
```

- [ ] **Step 14: Install dependencies and type-check**

Run: `pnpm install && cd packages/ui && pnpm type-check`
Expected: No errors

- [ ] **Step 15: Commit**

```bash
git add packages/ui
git commit -m "feat: add shared UI package (shadcn components + NoteCard + MarkdownRenderer)"
```

---

## Task 5: Create apps/web (Next.js) — Project Scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/.env.local.example`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@quicknote/types": "workspace:*",
    "@quicknote/shared": "workspace:*",
    "@quicknote/ui": "workspace:*",
    "@supabase/ssr": "^0.5",
    "@supabase/supabase-js": "^2",
    "next": "^15",
    "next-themes": "^0.4",
    "react": "^18",
    "react-dom": "^18",
    "react-markdown": "^9",
    "remark-gfm": "^4",
    "lucide-react": "^0.400"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quicknote/ui", "@quicknote/shared"],
};

export default nextConfig;
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";
import baseConfig from "@quicknote/ui/tailwind.config";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create .env.local.example**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 7: Create src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 8: Create src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickNote",
  description: "A simple note-taking app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Create src/app/page.tsx**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 10: Install dependencies**

Run: `pnpm install`
Expected: All dependencies resolved

- [ ] **Step 11: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold Next.js web app with tailwind + shadcn theme"
```

---

## Task 6: apps/web — Supabase Auth Integration

**Files:**
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/signup/page.tsx`
- Create: `apps/web/src/app/auth/callback/route.ts`

- [ ] **Step 1: Create src/lib/supabase/client.ts**

```typescript
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@quicknote/types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create src/lib/supabase/server.ts**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@quicknote/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create src/middleware.ts**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/notes"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/signup")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/notes/:path*", "/login", "/signup"],
};
```

- [ ] **Step 4: Create src/app/login/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@quicknote/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录 QuickNote</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              没有账号？{" "}
              <a href="/signup" className="text-primary underline">
                注册
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create src/app/signup/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@quicknote/ui";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, username });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>注册 QuickNote</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              已有账号？{" "}
              <a href="/login" className="text-primary underline">
                登录
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Create src/app/auth/callback/route.ts**

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib apps/web/src/middleware.ts apps/web/src/app/login apps/web/src/app/signup apps/web/src/app/auth
git commit -m "feat(web): add Supabase auth (login, signup, middleware, callback)"
```

---

## Task 7: apps/web — Dashboard (Note List)

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Create src/app/dashboard/page.tsx**

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NoteCard, Button } from "@quicknote/ui";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">我的笔记</h1>
        <div className="flex items-center gap-4">
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/login");
            }}
          >
            <Button variant="ghost" type="submit">
              退出登录
            </Button>
          </form>
          <Link href="/notes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建笔记
            </Button>
          </Link>
        </div>
      </div>

      {!notes || notes.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>还没有笔记，点击右上角创建第一篇吧</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <NoteCard note={note} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/dashboard
git commit -m "feat(web): add dashboard page with note list"
```

---

## Task 8: apps/web — Note Create & Edit Pages

**Files:**
- Create: `apps/web/src/app/notes/new/page.tsx`
- Create: `apps/web/src/app/notes/[id]/page.tsx`

- [ ] **Step 1: Create src/app/notes/new/page.tsx**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Textarea } from "@quicknote/ui";

export default function NewNotePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: title || "无标题",
        content,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      setSaving(false);
      return;
    }

    router.push(`/notes/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">新建笔记</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          placeholder="笔记标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold"
        />
        <Textarea
          placeholder="开始写点什么... (支持 Markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="font-mono"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "创建笔记"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/notes/[id]/page.tsx**

```tsx
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  MarkdownRenderer,
} from "@quicknote/ui";
import { generateSlug } from "@quicknote/shared";
import type { Note } from "@quicknote/types";
import { ArrowLeft, Share2, Eye, Edit2, Trash2 } from "lucide-react";

export default function NoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchNote() {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      }
    }
    fetchNote();
  }, [id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await supabase
      .from("notes")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(false);
  }, [title, content, id]);

  // Auto-save with debounce
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        handleSave();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, content, note, handleSave]);

  async function handleShare() {
    // Mark note as public
    await supabase.from("notes").update({ is_public: true }).eq("id", id);

    // Check if share link already exists
    const { data: existing } = await supabase
      .from("share_links")
      .select("slug")
      .eq("note_id", id)
      .single();

    if (existing) {
      setShareUrl(`${window.location.origin}/reader/?note=${existing.slug}`);
      return;
    }

    const slug = generateSlug();
    await supabase.from("share_links").insert({ note_id: id, slug });
    setShareUrl(`${window.location.origin}/reader/?note=${slug}`);
  }

  async function handleDelete() {
    if (!confirm("确定要删除这篇笔记吗？")) return;
    await supabase.from("notes").delete().eq("id", id);
    router.push("/dashboard");
  }

  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saving ? "保存中..." : "已保存"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreview(!preview)}
          >
            {preview ? (
              <Edit2 className="mr-1 h-4 w-4" />
            ) : (
              <Eye className="mr-1 h-4 w-4" />
            )}
            {preview ? "编辑" : "预览"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" />
            分享
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      {shareUrl && (
        <Card className="mb-4">
          <CardContent className="flex items-center gap-2 p-4">
            <span className="text-sm">分享链接：</span>
            <code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
              {shareUrl}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              复制
            </Button>
          </CardContent>
        </Card>
      )}

      {preview ? (
        <div className="rounded-lg border p-6">
          <h1 className="mb-4 text-2xl font-bold">{title}</h1>
          <MarkdownRenderer content={content} />
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            placeholder="笔记标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />
          <Textarea
            placeholder="开始写点什么... (支持 Markdown)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/notes
git commit -m "feat(web): add note create/edit pages with auto-save and share"
```

---

## Task 9: Create apps/reader (Vite React)

**Files:**
- Create: `apps/reader/package.json`
- Create: `apps/reader/tsconfig.json`
- Create: `apps/reader/vite.config.ts`
- Create: `apps/reader/tailwind.config.ts`
- Create: `apps/reader/postcss.config.js`
- Create: `apps/reader/index.html`
- Create: `apps/reader/.env.example`
- Create: `apps/reader/src/main.tsx`
- Create: `apps/reader/src/App.tsx`
- Create: `apps/reader/src/globals.css`
- Create: `apps/reader/src/components/NoteView.tsx`
- Create: `apps/reader/src/components/NotFound.tsx`
- Create: `apps/reader/src/components/Loading.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "reader",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "echo 'no lint configured'"
  },
  "dependencies": {
    "@quicknote/types": "workspace:*",
    "@quicknote/shared": "workspace:*",
    "@quicknote/ui": "workspace:*",
    "@supabase/supabase-js": "^2",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@vitejs/plugin-react": "^4",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5",
    "vite": "^6"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
});
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";
import baseConfig from "@quicknote/ui/tailwind.config";

const config: Config = {
  ...baseConfig,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create .env.example**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 7: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QuickNote Reader</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 9: Create src/main.tsx**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 10: Create src/components/Loading.tsx**

```tsx
export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Create src/components/NotFound.tsx**

```tsx
export function NotFound({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 12: Create src/components/NoteView.tsx**

```tsx
import { MarkdownRenderer, Card, CardContent } from "@quicknote/ui";
import { formatDate } from "@quicknote/shared";
import type { Note } from "@quicknote/types";

export function NoteView({ note }: { note: Note }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardContent className="pt-6">
          <h1 className="mb-4 text-3xl font-bold">{note.title}</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            创建于 {formatDate(note.created_at)}
          </p>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <MarkdownRenderer content={note.content} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 13: Create src/App.tsx**

```tsx
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@quicknote/shared";
import type { Note } from "@quicknote/types";
import { NoteView } from "./components/NoteView";
import { NotFound } from "./components/NotFound";
import { Loading } from "./components/Loading";

export default function App() {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNote() {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("note");

      if (!slug) {
        setError("缺少笔记参数");
        setLoading(false);
        return;
      }

      const supabase = createSupabaseClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      // Get share link
      const { data: shareLink } = await supabase
        .from("share_links")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!shareLink) {
        setError("笔记不存在或已被删除");
        setLoading(false);
        return;
      }

      // Check expiration
      if (shareLink.expires_at) {
        const expiresAt = new Date(shareLink.expires_at);
        if (expiresAt < new Date()) {
          setError("分享链接已过期");
          setLoading(false);
          return;
        }
      }

      // Get note
      const { data: noteData } = await supabase
        .from("notes")
        .select("*")
        .eq("id", shareLink.note_id)
        .eq("is_public", true)
        .single();

      if (!noteData) {
        setError("笔记不存在或未公开");
        setLoading(false);
        return;
      }

      setNote(noteData);
      setLoading(false);
    }

    fetchNote();
  }, []);

  if (loading) return <Loading />;
  if (error) return <NotFound message={error} />;
  if (!note) return <NotFound message="笔记不存在" />;

  return <NoteView note={note} />;
}
```

- [ ] **Step 14: Install dependencies**

Run: `pnpm install`
Expected: All dependencies resolved

- [ ] **Step 15: Commit**

```bash
git add apps/reader
git commit -m "feat: add Vite reader app for shared notes"
```

---

## Task 10: Setup Supabase Database

**Files:**
- Create: `supabase/schema.sql`
- Create: `supabase/README.md`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Notes table
create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null default '无标题',
  content text not null default '',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table notes enable row level security;

-- Notes policies
create policy "Users can view their own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "Anyone can view public notes"
  on notes for select
  using (is_public = true);

create policy "Users can insert their own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- Share links table
create table share_links (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references notes(id) on delete cascade not null,
  slug text unique not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table share_links enable row level security;

-- Share links policies
create policy "Users can view share links for their notes"
  on share_links for select
  using (
    exists (
      select 1 from notes
      where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
    )
  );

create policy "Anyone can view share links by slug"
  on share_links for select
  using (true);

create policy "Users can create share links for their notes"
  on share_links for insert
  with check (
    exists (
      select 1 from notes
      where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
    )
  );

create policy "Users can delete share links for their notes"
  on share_links for delete
  using (
    exists (
      select 1 from notes
      where notes.id = share_links.note_id
      and notes.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 2: Create supabase/README.md**

```markdown
# Supabase Setup

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

## 2. Run SQL Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the contents of `schema.sql`
3. Run the query

## 3. Configure Environment Variables

### apps/web/.env.local
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### apps/reader/.env
\`\`\`
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

## 4. Test Authentication

1. Run `pnpm dev` in the root
2. Navigate to `http://localhost:3000/signup`
3. Create an account
4. Verify profile is created in Supabase Dashboard
```

- [ ] **Step 3: Commit**

```bash
git add supabase
git commit -m "docs: add Supabase schema and setup instructions"
```

---

## Task 11: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy-web.yml`
- Create: `.github/workflows/deploy-reader.yml`

- [ ] **Step 1: Create .github/workflows/ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm turbo lint

      - name: Type check
        run: pnpm turbo type-check

      - name: Build
        run: pnpm turbo build
```

- [ ] **Step 2: Create .github/workflows/deploy-web.yml**

```yaml
name: Deploy Web to Vercel

on:
  push:
    branches: [main]
    paths:
      - "apps/web/**"
      - "packages/**"
      - "pnpm-lock.yaml"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm turbo build --filter=web
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
          vercel-args: "--prod"
```

- [ ] **Step 3: Create .github/workflows/deploy-reader.yml**

```yaml
name: Deploy Reader to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - "apps/reader/**"
      - "packages/**"
      - "pnpm-lock.yaml"

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build reader
        run: pnpm turbo build --filter=reader
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./apps/reader/dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Commit**

```bash
git add .github
git commit -m "ci: add GitHub Actions workflows for CI and deployment"
```

---

## Task 12: Project Documentation

**Files:**
- Create: `README.md`
- Create: `DEPLOYMENT.md`

- [ ] **Step 1: Create README.md**

```markdown
# QuickNote

一个基于 Monorepo 架构的全栈笔记应用，展示现代前端技术栈的集成。

## 技术栈

- **Monorepo**: pnpm + Turborepo
- **前端框架**: Next.js 15 (App Router) + Vite + React 18
- **样式**: Tailwind CSS + shadcn/ui
- **后端**: Supabase (Auth + Database + RLS)
- **类型安全**: TypeScript
- **CI/CD**: GitHub Actions
- **部署**: Vercel (Next.js) + GitHub Pages (Vite)

## 项目结构

\`\`\`
quicknote/
├── apps/
│   ├── web/          # Next.js 主应用
│   └── reader/       # Vite 分享阅读器
├── packages/
│   ├── ui/           # 共享 UI 组件
│   ├── shared/       # 共享工具函数
│   └── types/        # 共享类型定义
└── supabase/         # 数据库 schema
\`\`\`

## 快速开始

### 1. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 2. 配置 Supabase

参考 `supabase/README.md` 设置数据库。

### 3. 配置环境变量

\`\`\`bash
# apps/web/.env.local
cp apps/web/.env.local.example apps/web/.env.local

# apps/reader/.env
cp apps/reader/.env.example apps/reader/.env
\`\`\`

填入你的 Supabase URL 和 anon key。

### 4. 启动开发服务器

\`\`\`bash
pnpm dev
\`\`\`

- Next.js app: http://localhost:3000
- Vite reader: http://localhost:5173

## 功能特性

- ✅ 用户认证（邮箱/密码）
- ✅ Markdown 笔记编辑
- ✅ 实时自动保存
- ✅ 笔记分享（生成公开链接）
- ✅ 响应式设计
- ✅ 暗色模式支持

## 部署

参考 `DEPLOYMENT.md` 了解部署流程。

## License

MIT
\`\`\`

- [ ] **Step 2: Create DEPLOYMENT.md**

```markdown
# 部署指南

## 前置条件

1. GitHub 账号
2. Vercel 账号
3. Supabase 项目

## 1. Supabase 设置

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 运行 `supabase/schema.sql` 中的 SQL
3. 记录 Project URL 和 anon key

## 2. Vercel 部署 (Next.js)

### 方式 A: Vercel Dashboard (推荐)

1. 在 Vercel 导入 GitHub 仓库
2. Root Directory 设置为 `apps/web`
3. Framework Preset 选择 Next.js
4. 添加环境变量:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. 部署

### 方式 B: GitHub Actions

1. 获取 Vercel Token: https://vercel.com/account/tokens
2. 在 GitHub 仓库设置 Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` (从 Vercel 项目设置获取)
   - `VERCEL_PROJECT_ID` (从 Vercel 项目设置获取)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Push 到 main 分支自动部署

## 3. GitHub Pages 部署 (Vite Reader)

1. 在 GitHub 仓库设置 Secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. 启用 GitHub Pages:
   - Settings → Pages
   - Source: GitHub Actions
3. Push 到 main 分支自动部署
4. 访问: `https://<username>.github.io/<repo-name>/`

## 4. 更新 Vite Base URL

如果 GitHub Pages 使用仓库路径 (如 `/quicknote/`):

\`\`\`typescript
// apps/reader/vite.config.ts
export default defineConfig({
  base: "/quicknote/",  // 改为你的仓库名
});
\`\`\`

## 5. 验证部署

1. 访问 Vercel URL，注册账号
2. 创建笔记并生成分享链接
3. 在 GitHub Pages URL 访问分享链接
4. 验证笔记正常显示

## 故障排查

### Vercel 构建失败

- 检查环境变量是否正确设置
- 查看构建日志中的错误信息
- 确保 `turbo.json` 配置正确

### GitHub Pages 404

- 检查 `vite.config.ts` 中的 `base` 配置
- 确保 GitHub Pages 已启用
- 等待几分钟让部署生效

### Supabase 连接失败

- 检查 URL 和 anon key 是否正确
- 确保 RLS 策略已正确设置
- 检查浏览器控制台的错误信息
\`\`\`

- [ ] **Step 3: Commit**

```bash
git add README.md DEPLOYMENT.md
git commit -m "docs: add project README and deployment guide"
```

---

## Self-Review Checklist

### Spec Coverage Check

- [x] Monorepo structure with pnpm + turborepo ✓ (Task 1)
- [x] packages/types with shared TypeScript types ✓ (Task 2)
- [x] packages/shared with utility functions ✓ (Task 3)
- [x] packages/ui with shadcn components ✓ (Task 4)
- [x] apps/web Next.js app with auth ✓ (Tasks 5-6)
- [x] apps/web dashboard and note CRUD ✓ (Tasks 7-8)
- [x] apps/reader Vite SPA for shared notes ✓ (Task 9)
- [x] Supabase database schema and RLS ✓ (Task 10)
- [x] GitHub Actions CI/CD workflows ✓ (Task 11)
- [x] Project documentation ✓ (Task 12)

### Placeholder Scan

- [x] No TBD, TODO, or "implement later" ✓
- [x] All code blocks are complete ✓
- [x] All commands have expected output ✓
- [x] No "similar to Task N" references ✓

### Type Consistency Check

- [x] `Note`, `Profile`, `ShareLink` types consistent across all tasks ✓
- [x] Supabase client creation consistent (server vs browser) ✓
- [x] Function names consistent (`createClient`, `generateSlug`, etc.) ✓
- [x] Import paths consistent (`@quicknote/*`) ✓

---

## Plan Complete

All tasks defined with complete code, exact file paths, and verification steps. Ready for execution.

