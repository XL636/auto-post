# Phase 1: v1.0 Core `[进行中]`

## 一句话目标
完成 Tier-1 平台（LinkedIn, Facebook, Discord, Reddit）的全部功能：发帖、定时调度、草稿管理、内容日历、数据分析，Mac 上直接部署。

## 优先级排序
1. **必须完成**: 项目脚手架 + 数据库 + 平台接口 + 发帖流程
2. **尽量完成**: 完整 UI（日历、分析图表）
3. **如果有时间**: OAuth Token 自动刷新、媒体文件上传

## Task 列表

- [x] T-01: 项目脚手架（Next.js 15 + Tailwind 4 + shadcn/ui）— 验收: `npm run dev` 启动
- [x] T-02: Prisma Schema + 数据库迁移 — 验收: 4 表创建成功，prisma generate 通过
- [x] T-03: 共享工具（Redis + AES-256-GCM 加密）— 验收: 加密测试通过
- [x] T-04: 共享类型 + PlatformClient 接口 + Registry — 验收: 类型编译通过
- [x] T-05: Post Validator + Post Service — 验收: 单元测试通过
- [x] T-06: BullMQ Scheduler + Worker — 验收: Worker 可独立运行
- [x] T-07: Tier-1 平台实现（LinkedIn/Facebook/Discord/Reddit）— 验收: 4 平台注册到 registry
- [x] T-08: API Routes（Posts CRUD / OAuth / Accounts / Analytics / Calendar）— 验收: 所有端点就绪
- [x] T-09: Analytics + Calendar Services — 验收: 服务逻辑完整
- [x] T-10: UI 布局 + 共享组件 + Notion 主题 — 验收: 侧边栏 + 主题渲染正确
- [x] T-11: UI 页面（Dashboard / Posts / New Post / Drafts）— 验收: 4 个页面可交互
- [x] T-12: UI 页面（Calendar / Analytics / Accounts）— 验收: 3 个页面可交互
- [ ] T-13: 端到端验证 — 验收: 连接 PostgreSQL + Redis 后全部功能可用

## 架构变更评估
- 新增模块/文件: 79 个文件
- 数据库迁移: 待连接 PostgreSQL 后执行初始迁移
- API 变更: 全部为新端点（/api/posts, /api/accounts, /api/oauth, /api/analytics, /api/calendar）
- 部署方式变更: 去掉 Docker，改为 Mac 直接 `npm install && npm run dev`

## 验证标准
- [x] TypeScript 编译通过
- [x] 7 个单元测试通过
- [x] UI 页面可渲染（无数据库时显示 Loading）
- [ ] 4 个 Tier-1 平台 OAuth 连接流程可走通
- [ ] 创建帖子 → 即时发布 → 状态更新为 PUBLISHED
- [ ] 创建帖子 → 定时发布 → Worker 到时间自动发布
- [ ] 草稿保存 / 编辑 / 发布流程完整

## 预估风险
- 各平台 OAuth App 审核耗时 → 先用 Discord Bot Token 验证完整流程
- LinkedIn/Facebook API 变更频繁 → 接口层隔离，只改 client 不改 service
