# Phase 1: v1.0 Core `[待开始]`

## 一句话目标
完成 Tier-1 平台（LinkedIn, Facebook, Discord, Reddit）的全部功能：发帖、定时调度、草稿管理、内容日历、数据分析，本地 Docker 一键部署。

## 优先级排序
1. **必须完成**: 项目脚手架 + 数据库 + 平台接口 + 发帖流程 + Docker 部署
2. **尽量完成**: 完整 UI（日历、分析图表）
3. **如果有时间**: OAuth Token 自动刷新、媒体文件上传

## Task 列表

- [ ] T-01: 项目脚手架 + Docker 基础设施 — 验收: `npm run dev` 启动，Docker Compose 4 服务运行
- [ ] T-02: Prisma Schema + 数据库迁移 — 验收: 4 表创建成功，Prisma Studio 可查看
- [ ] T-03: 共享工具（Redis + AES-256-GCM 加密）— 验收: 加密测试通过
- [ ] T-04: 共享类型 + PlatformClient 接口 + Registry — 验收: 类型编译通过
- [ ] T-05: Post Validator + Post Service — 验收: 5 个单元测试通过
- [ ] T-06: BullMQ Scheduler + Worker — 验收: 调度测试通过，Worker 可独立运行
- [ ] T-07: Tier-1 平台实现（LinkedIn/Facebook/Discord/Reddit）— 验收: 4 平台注册到 registry
- [ ] T-08: API Routes（Posts CRUD / OAuth / Accounts / Analytics）— 验收: 所有端点返回正确 JSON
- [ ] T-09: Analytics + Calendar Services — 验收: 日历分组测试通过
- [ ] T-10: UI 布局 + 共享组件 + Notion 主题 — 验收: 侧边栏 + 主题渲染正确
- [ ] T-11: UI 页面（Dashboard / Posts / New Post / Drafts）— 验收: 4 个页面可交互
- [ ] T-12: UI 页面（Calendar / Analytics / Accounts）— 验收: 3 个页面可交互
- [ ] T-13: Docker 构建 + 端到端验证 — 验收: `docker compose up` 全部服务正常，localhost:3000 可访问

## 架构变更评估
- 新增模块/文件: 全部为新建
- 数据库迁移: 初始迁移，4 表 2 枚举
- API 变更: 全部为新端点（/api/posts, /api/accounts, /api/oauth, /api/analytics, /api/scheduler）

## 验证标准
- [ ] 4 个 Tier-1 平台 OAuth 连接流程可走通
- [ ] 创建帖子 → 即时发布 → 状态更新为 PUBLISHED
- [ ] 创建帖子 → 定时发布 → Worker 到时间自动发布
- [ ] 草稿保存 / 编辑 / 发布流程完整
- [ ] 日历页面显示排期帖子
- [ ] 分析页面显示互动数据
- [ ] Docker Compose 一键部署成功
- [ ] 全部单元测试通过

## 预估风险
- 各平台 OAuth App 审核耗时 → 先用 Discord Bot Token 验证完整流程
- LinkedIn/Facebook API 变更频繁 → 接口层隔离，只改 client 不改 service
