# Phase 1: v1.0 Core `[完成]`

## 一句话目标
完成 Tier-1 平台（LinkedIn, Facebook, Discord, Reddit）的全部功能：发帖、定时调度、草稿管理、内容日历、数据分析，Mac 上直接部署。

## Task 列表

- [x] T-01: 项目脚手架（Next.js 15 + Tailwind 4 + shadcn/ui）
- [x] T-02: Prisma Schema + 数据库迁移
- [x] T-03: 共享工具（Redis + AES-256-GCM 加密）
- [x] T-04: 共享类型 + PlatformClient 接口 + Registry
- [x] T-05: Post Validator + Post Service
- [x] T-06: BullMQ Scheduler + Worker
- [x] T-07: Tier-1 平台实现（LinkedIn/Facebook/Discord/Reddit）
- [x] T-08: API Routes（Posts CRUD / OAuth / Accounts / Analytics / Calendar）
- [x] T-09: Analytics + Calendar Services
- [x] T-10: UI 布局 + 共享组件 + Notion 主题
- [x] T-11: UI 页面（Dashboard / Posts / New Post / Drafts）
- [x] T-12: UI 页面（Calendar / Analytics / Accounts）
- [x] T-13: 端到端验证（PostgreSQL + Redis 已连接，全部功能可用）

---

# Phase 2: 功能补全 `[完成]`

## 一句话目标
补全 v1.0 的功能空缺，新增 Tier-2 平台（Twitter/X, YouTube），提升体验。

## Task 列表

### Phase A — 跑通 v1.0
- [x] A-1: 创建 .env.example
- [x] A-2: Docker Compose 配置（PostgreSQL 16 + Redis 7）
- [x] A-3: Toast 全局通知系统 (sonner)
- [x] A-4: Analytics 定时同步（BullMQ 每小时）
- [x] A-5: LinkedIn Token 自动刷新
- [x] A-6: 平台删帖接入 UI
- [x] A-7: 更新 README

### Phase B — 体验提升
- [x] B-1: 媒体文件上传（本地存储）
- [x] B-2: LinkedIn/Discord Analytics 真实 API
- [x] B-3: Post 编辑页完善（平台徽章 + 字数统计）
- [x] B-4: 批量操作（批量发布/删除）

### Phase C — v1.1 新功能
- [x] C-1: Twitter/X 集成（OAuth 2.0 PKCE + v2 API）
- [x] C-2: YouTube 集成（Google OAuth + Data API v3）

---

# Phase 3: i18n + 基础设施 `[完成]`

## 一句话目标
中英双语支持，数据库部署打通。

## Task 列表
- [x] next-intl 集成 + i18n 路由 ([locale])
- [x] 翻译文件 (messages/zh.json + messages/en.json, ~150 key)
- [x] 所有页面迁移到 app/[locale]/ 并使用 useTranslations()
- [x] Sidebar 语言切换按钮
- [x] StatusBadge i18n
- [x] Docker Compose 部署 (端口 5433/6380 避免冲突)
- [x] Prisma 7 pg adapter + migration
- [x] Discord 连接引导弹窗

---

# Phase 4: UI 打磨 + i18n 深化 `[完成]`

## 一句话目标
消灭中文 locale 下所有残留英文，优化账号页 UI/UX。

## Task 列表
- [x] D-1: date-fns 中文日期（useFormatDate hook + 4 页面适配）
- [x] D-2: 账号页 UI 重设计（Notion 风格卡片网格 + 品牌色 + 空状态）
- [x] D-3: 平台名中文化（品牌名 + 中文副标题，accounts/analytics/editPost 三页）
- [x] D-4: 关闭 Next.js DevTools（devIndicators: false）
- [x] D-5: Discord 弹窗 UI 优化（品牌色色条 + 深色代码块）

---

# Phase 5: 账号稳定性 + 发布守卫 `[完成]`

## 一句话目标
把账号链路从“能连上”补到“能稳定用”，并把发布前校验、错误回写、Worker/即时发布逻辑统一起来。

## Task 列表
- [x] E-1: 统一账号 token 解密与自动刷新
- [x] E-2: OAuth state 校验 + locale 回跳
- [x] E-3: Discord 手动接入 API 闭环
- [x] E-4: 多账号连接支持 + 安全断开保护
- [x] E-5: 账号状态展示（正常 / 即将过期 / 已过期 / 待配置 / 错误）
- [x] E-6: 统一发布服务（即时发布 / Worker 共用）
- [x] E-7: 平台级内容/媒体校验 + 前端错误回显
- [x] E-8: Next.js `middleware` 迁移到 `proxy`
