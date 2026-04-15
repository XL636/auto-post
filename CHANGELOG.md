# Changelog

All notable changes to this project will be documented in this file.

## [0.2.6] - 2026-04-15

### Added — 其余平台连接/发布修复
- 新增 YouTube resumable video upload 发布链路与处理状态轮询能力
- 新增 Reddit `[r/subreddit]` 内容语法，用于在正文中指定目标 subreddit

### Changed
- LinkedIn 发帖从旧版 `ugcPosts` 切换到 `https://api.linkedin.com/rest/posts`
- LinkedIn 删除接口切换到新版 `/rest/posts/{id}`，并保持 analytics 查询兼容新版 post ID
- YouTube 平台能力声明改为“必须带视频、不可纯文本”
- 发布前媒体校验放开 YouTube，不再把它视为“媒体未实现平台”
- Discord 账号连接与资料拉取改为优先读取真实 Bot ID、用户名和头像

### Fixed
- 修复 LinkedIn 新应用可能因旧版 UGC Posts API 被限制而发帖失败的问题
- 修复 Reddit 发帖只能硬编码发到用户 profile、不能投递 subreddit 的问题
- 修复 Reddit refresh token 接口在失败时静默写入无效 token 的问题
- 修复 YouTube 继续调用已废弃 bulletin API 导致文本发布 100% 失败的问题
- 修复 Discord 连接后账号信息总是显示固定占位 Bot 的问题

## [0.2.5] - 2026-04-15

### Added — OAuth 连接修复
- 新增 Facebook 专属 OAuth 入口、回调和 Page 选择 API
- 新增 Facebook Page 选择页面，支持用户在授权后选择要绑定的 Page
- 新增 Facebook Page 列表获取、长效 user token 交换能力

### Changed
- Twitter/X OAuth 清理遗留 PKCE 内存 store，统一只通过 cookie 传递 verifier
- 通用 OAuth 路由对 Twitter / Facebook 改为早返回到专属路由，避免错误的 `state` 处理
- Facebook 账号模型改为保存 Page ID + Page access token，发布流程正式对齐 Facebook Pages API
- Facebook client 的 `getUserProfile` / `refreshToken` 适配 Page token 模式
- 账号页新增 Facebook OAuth 失败场景 toast 处理，并补齐中英文翻译文案

### Fixed
- 修复 Twitter 误走通用 OAuth 路由时可能出现重复 `state` 参数的问题
- 修复 Facebook OAuth 后保存的是 user token / user id，导致无法向 Page 发帖的问题
- 修复 Facebook 缺少 Page 选择流程，多个 Page 账号无法完成连接的问题

## [0.2.4] - 2026-04-13

### Added — Phase 7: UX 优化
- 新增移动端侧边栏抽屉、顶部导航栏、遮罩关闭交互
- 新增通用 UI 组件：`ConfirmDialog`、`Skeleton`、空状态组件、平台限制条组件、确认弹窗 hook
- 新增更完整的空状态引导与加载骨架屏，覆盖 Dashboard / Posts / Drafts / Accounts / Analytics / Calendar
- 新增帖子失败重试入口与失败原因展示

### Changed
- Dashboard、Analytics、Calendar、Posts 列表适配移动端布局
- 桌面端侧边栏改为可拖拽伸缩，并支持双击恢复默认宽度
- 新建/编辑帖子页改为更清晰的操作流：拖拽上传、平台字数限制、时区提示、定时校验、三按钮操作区
- 账号页改为上下文式引导：缺少凭证时显示卡片内联提醒，异常账号提供 Reconnect / Fix Credentials 操作
- 平台凭证页增加 callback URL 复制、凭证来源解释、平台申请入口提示

### Fixed
- 修复移动端下固定侧边栏挤压主内容区域的问题
- 修复原生 `confirm()` 带来的交互割裂，统一改为自定义确认弹窗
- 修复平台凭证页表单初始化导致的 `Maximum update depth exceeded` 渲染死循环
- 修复编辑帖子时 `scheduledAt` 直接以字符串写入更新逻辑的问题

## [0.2.3] - 2026-04-13

### Added — Phase 6: 用户自助平台凭证
- 新增 `PlatformCredential` 数据模型与迁移，用于按平台保存用户自带开发凭证
- 新增“平台凭证”设置页与 `/api/platform-credentials` API，支持在页面填写 LinkedIn / X / Facebook / Discord / Reddit / YouTube 凭证
- 新增凭证状态展示：数据库 / 环境变量 / 未配置，以及 OAuth 回调地址提示
- 新增账号状态测试，覆盖“缺少平台凭证 -> MISCONFIGURED” 场景

### Changed
- OAuth 和 Discord 接入改为优先读取数据库凭证，普通用户无需手改 `.env`
- 账号页连接卡片改为先检查平台凭证；未配置时直接引导到凭证页
- Sidebar、README 和中英文文案更新为“用户自助填写平台凭证”的产品流程
- 平台 client 的 `getAuthUrl` 改为异步，以支持数据库凭证解析

### Fixed
- 修复 YouTube / Reddit / 其他 OAuth 平台在未配置 `.env` 时跳转出 `client_id=undefined` 的问题
- 修复 Prisma schema 更新后旧 Prisma Client 未包含 `platformCredential` 导致 `/api/accounts`、`/api/platform-credentials` 500 的问题
- 应用数据库迁移 `20260413023500_platform_credentials`

## [0.2.2] - 2026-04-13

### Added — Phase 5: 账号稳定性 + 发布守卫
- 统一账号服务：OAuth token 解密、自动刷新、最近错误回写、最近校验时间记录
- 账号状态模型：`ACTIVE` / `EXPIRING_SOON` / `EXPIRED` / `MISCONFIGURED` / `ERROR`
- Discord 手动接入 API：环境变量配置完成后可在账号页直接落库
- 统一发布服务：即时发布 API 和 BullMQ Worker 共用一套发布逻辑
- 平台级发布守卫：空内容、字数、媒体数量、未知媒体格式、未实现媒体上传能力统一校验
- 新增测试：账号状态判断、平台发布校验
- 新增数据库字段：`Account.lastError`、`Account.lastValidatedAt`

### Changed
- OAuth 流程补上 `state` 校验，并在回调后保留 locale 返回对应语言的账号页
- 同平台账号支持多连接，账号页不再按平台一刀切禁用 OAuth 按钮
- 账号页增加状态徽标、关联帖子数量、最近错误展示
- 发布失败时的错误信息现在会回写到 `PostPlatform.errorMessage` 和账号状态
- README 更新为当前实际能力说明，包含账号状态、Discord 接入、发布守卫、Next.js 16 / `proxy.ts`
- `middleware.ts` 迁移为 `proxy.ts`

### Fixed
- 修复 token 加密存储后发布/拉取分析直接拿密文调用平台 API 的问题
- 修复 Worker 场景下平台 client 注册不完整的问题（补齐 YouTube 注册）
- 修复账号断开时遇到已关联帖子直接触发外键错误的问题，改为前置阻止并给出提示
- 修复创建定时帖子时无校验导致任务到点才失败的问题，改为创建阶段就拦截
- 修复 Next.js 16 对 `middleware` 文件约定的废弃警告
- 应用数据库迁移 `20260413004000_account_status`

## [0.2.1] - 2026-04-12

### Added — Phase 4: UI 打磨 + i18n 深化
- `useFormatDate` hook：根据 next-intl locale 自动切换 date-fns 中文/英文日期格式
- 平台名中文化：品牌名 + 中文副标题（领英/推特/脸书/油管），翻译文件新增 `platform` namespace
- 账号页 UI 全面重设计：3 列品牌色卡片网格、虚线空状态、hover 阴影交互、Discord 弹窗优化（品牌色头部 + 深色代码块）

### Changed
- 日期格式从英文 "MMM d, yyyy" 改为 "yyyy/MM/dd"（4 个页面：posts/drafts/accounts/calendar）
- 账号页平台按钮从 inline 改为 grid 卡片布局
- 关闭 Next.js DevTools（next.config.ts devIndicators: false）

### Fixed
- 中文 locale 下 date-fns 输出英文月份的问题
- 平台名 "Twitter 推特" 在窄卡片中换行错乱（改为品牌名+副标题两行布局）

## [0.2.0] - 2026-04-11

### Added — Phase 2: 功能补全
- Toast 全局通知系统 (sonner)，所有 API 操作有成功/失败提示
- Analytics 定时同步：BullMQ 每小时自动同步已发布帖子的分析数据
- LinkedIn OAuth token 自动刷新 (refresh_token grant)
- LinkedIn Analytics 真实 API (socialActions endpoint)
- Discord Analytics 真实 API (Bot API reactions)
- 平台删帖接入 UI：删除帖子时同步删除远端平台帖子
- 媒体文件上传：Upload API + 图片预览/删除 UI（10MB 限制，类型白名单）
- Post 编辑页完善：平台徽章显示 + 实时字数统计 + 平台限制对比
- 批量操作：帖子列表复选框 + 批量发布/删除 API
- Twitter/X 平台集成：OAuth 2.0 PKCE + v2 API（发帖/删帖/Analytics）
- YouTube 平台集成：Google OAuth + Data API v3（发帖/Analytics）
- Worker 入口脚本 (`npm run workers`)
- .env.example 环境变量模板
- Docker Compose 配置（PostgreSQL 16 + Redis 7）
- README 项目文档（中文）
- Bulk API endpoint (`/api/posts/bulk`)
- Upload API endpoint (`/api/upload`)

### Added — Phase 3: i18n + 基础设施
- i18n 中英双语支持 (next-intl + App Router [locale] 路由)
- 翻译文件：messages/zh.json + messages/en.json (~150 个翻译 key)
- 所有 8 个页面迁移到 app/[locale]/ 并使用 useTranslations()
- Sidebar 语言切换按钮（标题栏 EN/中 一键切换）
- StatusBadge i18n（状态标签根据语言显示中/英文）
- 动态 metadata（页面标题/描述根据语言切换）
- Discord 连接引导弹窗（替代简陋的 toast 提示）
- Prisma 7 pg adapter 适配
- 数据库 migration 初始化

### Fixed
- Docker Compose 端口改为 5433/6380 避免与其他项目冲突
- Discord publish 返回 channelId/messageId 格式，deletePost 和 getAnalytics 兼容新格式
- Prisma 7 PrismaClient 构造器使用 @prisma/adapter-pg
- YouTube config 适配 PlatformConfig 接口字段

## [0.1.0] - 2026-04-10

### Added — Phase 1: v1.0 Core
- Design spec document
- Implementation plan v1.0 with 13 tasks
- Project tracking documents (TASKS.md, PROGRESS.md, ROADMAP.md, DECISIONS.md)
- Platform tier system: T1 (LinkedIn/Facebook/Discord/Reddit), T2 (Twitter/YouTube), T3 (Instagram/TikTok)
- Next.js 15 + React 19 + Tailwind CSS 4 项目脚手架
- Prisma 7 schema: Account, Post, PostPlatform, Analytics (4 models, 2 enums)
- AES-256-GCM token encryption with random nonce
- BullMQ scheduler + independent worker process
- Tier-1 platform clients: LinkedIn, Facebook, Discord, Reddit
- Platform registry with unified PlatformClient interface
- Post service: CRUD, drafts, content validation per platform
- Calendar service: month/week view grouping
- Analytics service: aggregation by platform/time
- API routes: posts, accounts, OAuth, analytics, calendar
- Notion-themed UI: Dashboard, Posts, New Post, Drafts, Calendar, Analytics, Accounts
- 7 unit tests (encryption round-trip + content validation)

### Fixed
- Replace shadcn/ui @base-ui components with self-contained implementations
- Prisma 7 datasource url moved to prisma.config.ts
- Remove unused sonner.tsx (lucide-react dependency)
- Add missing lib/utils.ts for cn() helper
