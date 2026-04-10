# Auto Post Web - Design Spec

> 类 Postiz 的社交媒体自动发帖工具，本地 Docker 部署，自用/给同事用。

## 1. 项目概述

### 目标
一个自托管的社交媒体管理工具，支持多平台发帖、定时调度、内容日历和数据分析。

### 约束
- 本地 Docker 部署，零服务费
- 单用户模式（预留多用户扩展，数据模型含 userId）
- 8 个社交平台（分 Tier 实现）
- Notion 风格 UI

### 平台分级

| Tier | 平台 | 理由 |
|------|------|------|
| **Tier-1（v1.0 核心）** | LinkedIn, Facebook, Discord, Reddit | OAuth 标准、API 稳定、无付费门槛 |
| **Tier-2（v1.1 扩展）** | Twitter/X, YouTube | Twitter 需 Basic Plan ($100/月)，YouTube 需 API 配额申请 |
| **Tier-3（v1.2 实验）** | Instagram, TikTok | Instagram 仅支持 Business 账号 + 异步两步发布；TikTok 未审核 App 内容强制私有 |

### 不做
- AI 辅助写作（第一版不含）
- 多用户认证系统（预留字段但不实现）
- 评论回复管理
- 团队协作功能

---

## 2. 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| 前端 | Next.js App Router + React 19 | Next.js 15 |
| 样式 | Tailwind CSS + shadcn/ui | Tailwind 4 |
| 后端 | Next.js API Routes | 同上 |
| 数据库 | PostgreSQL + Prisma ORM | PG 16, Prisma 6 |
| 任务队列 | BullMQ + Redis | Redis 7 |
| 部署 | Docker Compose | 3 个容器 |

### 架构方案：Next.js 全栈 + BullMQ（方案 C）

选择理由：
- 全栈单体开发效率高，一套代码
- BullMQ 保证定时发帖可靠性（任务存 Redis，进程重启不丢）
- 分模块架构，后续可平滑迁移到前后端分离（方案 B）

---

## 3. 架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────┐
│                  浏览器                       │
│         http://localhost:3000                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Next.js App Router                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Pages   │  │API Routes│  │ BullMQ    │ │
│  │ (React)  │  │ (/api/*) │  │ Worker    │ │
│  └──────────┘  └────┬─────┘  └─────┬─────┘ │
│                     │              │         │
│  ┌──────────────────▼──────────────▼──────┐ │
│  │          Modules (业务逻辑)             │ │
│  │  posts | platforms | scheduler |       │ │
│  │  calendar | analytics | dashboard      │ │
│  └──────────────────┬─────────────────────┘ │
└──────────────────────┼──────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌─────▼────┐  ┌────▼────┐
    │PostgreSQL│  │  Redis   │  │ 各平台   │
    │ (Prisma) │  │ (BullMQ) │  │  API    │
    └─────────┘  └──────────┘  └─────────┘
```

### 3.2 分层原则

- **app/**（外壳）：处理 HTTP 请求和页面渲染，不写业务逻辑
- **modules/**（内核）：纯业务逻辑，不依赖 Next.js 框架
- **shared/**：跨模块共享的 UI 组件、工具函数、类型定义

调用方向：`app/` → `modules/` → `shared/`（单向依赖）

### 3.3 模块间通信

- 模块内部：直接 import 调用（同一个模块是"一家人"）
- 模块之间：通过导出的 service 函数调用
- platforms 模块：统一 PlatformClient 接口，各平台实现同一套操作

---

## 4. 目录结构

```
auto-post-web/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # 首页仪表盘
│   │   └── page.tsx
│   ├── posts/                    # 帖子管理页面
│   │   ├── page.tsx              #   列表
│   │   ├── new/page.tsx          #   新建/编辑
│   │   └── drafts/page.tsx       #   草稿箱
│   ├── calendar/                 # 内容日历页面
│   │   └── page.tsx
│   ├── accounts/                 # 平台账户管理页面
│   │   └── page.tsx
│   ├── analytics/                # 数据分析页面
│   │   └── page.tsx
│   ├── api/                      # API Routes
│   │   ├── posts/route.ts
│   │   ├── accounts/route.ts
│   │   ├── scheduler/route.ts
│   │   ├── analytics/route.ts
│   │   └── oauth/[platform]/
│   │       └── callback/route.ts
│   ├── layout.tsx
│   └── globals.css
│
├── modules/                      # 核心业务逻辑
│   ├── posts/
│   │   ├── post.service.ts
│   │   ├── post.validator.ts
│   │   └── types.ts
│   ├── platforms/
│   │   ├── platform.interface.ts # 统一接口
│   │   ├── registry.ts           # 平台注册表
│   │   ├── twitter/
│   │   │   ├── twitter.auth.ts
│   │   │   ├── twitter.client.ts
│   │   │   └── twitter.config.ts
│   │   ├── linkedin/
│   │   ├── instagram/
│   │   ├── facebook/
│   │   ├── tiktok/
│   │   ├── discord/
│   │   ├── reddit/
│   │   └── youtube/
│   ├── scheduler/
│   │   ├── queue.ts
│   │   ├── worker.ts
│   │   └── scheduler.service.ts
│   ├── analytics/
│   │   ├── analytics.service.ts
│   │   └── analytics.sync.ts
│   └── calendar/
│       └── calendar.service.ts
│
├── shared/
│   ├── components/               # 通用 UI 组件
│   ├── hooks/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── redis.ts
│   │   └── encryption.ts        # Token 加密
│   └── types/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
└── CLAUDE.md
```

---

## 5. 数据模型

```prisma
enum Platform {
  TWITTER
  LINKEDIN
  INSTAGRAM
  FACEBOOK
  TIKTOK
  DISCORD
  REDDIT
  YOUTUBE
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
}

model Account {
  id             String    @id @default(cuid())
  userId         String    @default("default")
  platform       Platform
  accessToken    String    // AES 加密存储
  refreshToken   String?
  platformUserId String
  displayName    String
  avatarUrl      String?
  tokenExpiresAt DateTime?
  tokenType      String?   // short-lived / long-lived
  scopes         String[]  // 实际授权的 OAuth scope
  posts          PostPlatform[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId, platform, platformUserId])
}

model Post {
  id          String       @id @default(cuid())
  userId      String       @default("default")
  content     String
  mediaUrls   String[]
  status      PostStatus   @default(DRAFT)
  scheduledAt DateTime?
  publishedAt DateTime?
  platforms   PostPlatform[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([userId, status])
  @@index([scheduledAt])
}

model PostPlatform {
  id             String     @id @default(cuid())
  postId         String
  accountId      String
  post           Post       @relation(fields: [postId], references: [id], onDelete: Cascade)
  account        Account    @relation(fields: [accountId], references: [id])
  platformPostId String?
  status          PostStatus @default(DRAFT)
  overrideContent String?    // 各平台差异化内容覆盖
  errorMessage    String?
  publishedAt     DateTime?
  analytics       Analytics[]

  @@unique([postId, accountId])
  @@index([status])
  @@index([accountId, status])
}

model Analytics {
  id             String       @id @default(cuid())
  postPlatformId String
  postPlatform   PostPlatform @relation(fields: [postPlatformId], references: [id], onDelete: Cascade)
  likes          Int          @default(0)
  comments       Int          @default(0)
  shares         Int          @default(0)
  impressions    Int          @default(0)
  clicks         Int          @default(0)
  fetchedAt      DateTime     @default(now())

  @@index([postPlatformId, fetchedAt])
}
```

### 关键设计决策

- **Post ↔ Account 多对多**：通过 PostPlatform 关联，一条帖子可发多个平台
- **每平台独立状态**：Twitter 成功 / LinkedIn 失败，互不影响
- **Analytics 时序数据**：同一帖子多次拉取，可看趋势变化
- **userId 预留**：所有表含 userId，默认 "default"，加多用户只需加认证层
- **Token 加密**：accessToken 用 AES-256-GCM 加密存储，每次加密生成随机 12-byte nonce，nonce + ciphertext 拼接存储
- **平台差异化内容**：PostPlatform.overrideContent 允许各平台发布不同内容
- **OAuth scope 追踪**：Account.scopes 存储实际授权范围，发帖前 pre-flight 校验

---

## 6. 核心模块设计

### 6.1 platforms — 平台适配层

```typescript
// platform.interface.ts
export interface PlatformClient {
  // 认证
  getAuthUrl(): string
  handleCallback(code: string): Promise<TokenPair>
  refreshToken(token: string): Promise<TokenPair>

  // 发帖（支持同步和异步两步发布，如 Instagram）
  publish(content: string, mediaUrls?: string[]): Promise<PublishResult>
  pollPublishStatus?(jobId: string): Promise<PublishResult>  // Instagram 等异步平台
  delete(platformPostId: string): Promise<void>

  // 数据
  getAnalytics(platformPostId: string): Promise<AnalyticsData>
  getUserProfile(): Promise<UserProfile>
}
```

8 个平台各自实现此接口。通过 registry 统一获取：

```typescript
// registry.ts
const clients: Record<Platform, () => PlatformClient> = {
  TWITTER: (account) => new TwitterClient(account),
  LINKEDIN: (account) => new LinkedInClient(account),
  // ...
}

export function getPlatformClient(platform: Platform, account: Account): PlatformClient {
  return clients[platform](account)
}
```

### 6.2 scheduler — 任务调度

- 使用 BullMQ 创建 `publish-queue` 队列
- 即时发布：直接调 platformClient.publish()
- 定时发布：BullMQ job with delay
- Worker 处理逻辑：取出 job → 获取 platformClient → publish → 更新状态
- 失败重试：3 次，指数退避（1min, 5min, 15min）
- Analytics 同步：独立队列 `analytics-sync-queue`，每小时触发

### 6.3 posts — 帖子管理

- CRUD：创建/编辑/删除帖子
- 草稿：status=DRAFT 的帖子
- 发布流程：校验内容 → 检查各平台限制 → 即时发或加队列
- 内容校验：各平台字数限制、媒体格式/大小限制

### 6.4 analytics — 数据分析

- 定时拉取：BullMQ 每小时从各平台拉互动数据
- 聚合统计：按平台/时间/帖子维度聚合
- 最佳发布时间：基于历史互动数据推算
- 图表数据：给前端提供 chart-ready 的数据格式

---

## 7. 页面设计

### 7.1 布局

```
┌──────────────────────────────────────────────────┐
│  Auto Post Web                            [头像] │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Dashboard │   主内容区域                         │
│  帖子管理   │                                     │
│  草稿箱    │                                     │
│  内容日历   │                                     │
│  数据分析   │                                     │
│  账户管理   │                                     │
│            │                                     │
└────────────┴─────────────────────────────────────┘
```

### 7.2 核心页面

| 页面 | 功能 |
|------|------|
| Dashboard | 概览卡片（今日待发/已发/失败）+ 最近帖子列表 |
| 帖子管理 | 帖子列表、筛选（状态/平台）、批量操作 |
| 新建帖子 | 富文本编辑器 + 平台选择 + 实时预览 + 定时设置 |
| 草稿箱 | 草稿列表、快速编辑、一键发布 |
| 内容日历 | 月/周/日视图、拖拽调整排期 |
| 数据分析 | 互动数据图表、平台对比、最佳发布时间 |
| 账户管理 | 已连接平台列表、OAuth 连接/断开、Token 状态 |

### 7.3 设计风格 — Notion

- **配色**：白色基底 (#FFFFFF)，浅灰边框 (#E8E8E8)，黑色文字 (#37352F)
- **强调色**：蓝色 (#2383E2) 用于链接和主操作
- **字体**：系统字体栈，-apple-system, BlinkMacSystemFont, "Segoe UI"
- **圆角**：3-4px（Notion 标志性的微圆角）
- **间距**：8px 基准网格
- **组件**：shadcn/ui 作为基础，覆盖为 Notion 风格
- **特点**：干净留白、内容优先、最小化装饰

---

## 8. 数据流

### 发帖流程

```
用户创建帖子 → 选择平台 + 时间
  │
  ├── 即时发布 → postService.publish()
  │                ├── getPlatformClient(twitter).publish() → Twitter API
  │                ├── getPlatformClient(linkedin).publish() → LinkedIn API
  │                └── ... (并行)
  │                → 更新各 PostPlatform.status
  │
  └── 定时发布 → schedulerService.schedule(post, scheduledAt)
                  → BullMQ.add('publish', { postId }, { delay })
                  → Redis 存储
                  ... (等到时间)
                  → Worker.process()
                  → 同上发布流程
```

### 数据分析流程

```
BullMQ 定时任务（每小时）
  → analyticsSync.syncAll()
  → 遍历所有 published 的 PostPlatform
  → getPlatformClient(platform).getAnalytics(platformPostId)
  → 写入 Analytics 表
  → Dashboard / 分析页面读取展示
```

---

## 9. 环境变量

```env
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/autopost"

# Redis
REDIS_URL="redis://localhost:6379"

# Token 加密密钥
ENCRYPTION_KEY="32-byte-hex-key"

# Twitter/X
X_API_KEY=""
X_API_SECRET=""

# LinkedIn
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""

# Instagram (Meta)
INSTAGRAM_APP_ID=""
INSTAGRAM_APP_SECRET=""

# Facebook
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""

# TikTok
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""

# Discord
DISCORD_BOT_TOKEN=""

# Reddit
REDDIT_CLIENT_ID=""
REDDIT_CLIENT_SECRET=""

# YouTube (Google)
YOUTUBE_CLIENT_ID=""
YOUTUBE_CLIENT_SECRET=""
```

---

## 10. Docker 部署

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: node dist/worker.js
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: autopost
      POSTGRES_PASSWORD: password

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## 11. 各平台 API 限制

| 平台 | Tier | 文字限制 | 媒体 | 频率限制 | OAuth | 备注 |
|------|------|---------|------|---------|-------|------|
| LinkedIn | T1 | 3000 字符 | 图片 20 张/视频 1 个 | 100 帖/天 | OAuth 2.0 | 稳定 |
| Facebook | T1 | 63206 字符 | 图片/视频 | 50 帖/天 | OAuth 2.0 (Meta) | 稳定 |
| Discord | T1 | 2000 字符 | 图片/视频 | 无限制 | Bot Token | 最简单 |
| Reddit | T1 | 40000 字符 | 图片/视频 | 60 请求/min | OAuth 2.0 | 稳定 |
| Twitter/X | T2 | 280 字符 | 图片 4 张/视频 1 个 | 1500 帖/月(Free) | OAuth 2.0 PKCE | 需 Basic Plan($100/月)才实用 |
| YouTube | T2 | 5000 字描述 | 仅视频 | API 配额制 | OAuth 2.0 (Google) | 需申请 API 配额 |
| Instagram | T3 | 2200 字符 | 图片/视频必须有 | 25 帖/天 | OAuth 2.0 (Meta) | 仅 Business 账号，异步两步发布 |
| TikTok | T3 | 2200 字符 | 图片/视频 | API 限制 | OAuth 2.0 | 未审核 App 内容强制私有 |

---

## 12. 扩展路径

| 阶段 | 功能 |
|------|------|
| v1.0 | Tier-1 平台（LinkedIn, Facebook, Discord, Reddit）+ 全部 UI 功能 |
| v1.1 | Tier-2 平台（Twitter/X, YouTube）+ AI 辅助写作 |
| v1.2 | Tier-3 平台（Instagram, TikTok）+ 多用户 + 认证系统 |
| v2.0 | 前后端分离（迁移到方案 B） |
| v2.1 | 团队协作、角色权限 |
| v2.2 | MCP Server 接口 |
