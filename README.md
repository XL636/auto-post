# Auto Post Web

自托管的社交媒体定时发帖工具，灵感来自 Postiz。支持 LinkedIn、Facebook、Discord、Reddit、Twitter/X、YouTube 多平台统一发帖、定时排程和账号管理。

## 功能
- 多平台发帖（LinkedIn、Facebook、Discord、Reddit、Twitter/X、YouTube）
- 定时排程发布（BullMQ 队列）
- 草稿管理
- 内容日历（月视图）
- 数据分析仪表板
- OAuth 账号管理
- 账号状态展示（正常 / 即将过期 / 已过期 / 待配置 / 需检查）
- OAuth `state` 校验 + 多语言 locale 回跳
- Discord Bot/Webhook 手动接入闭环
- 多账号连接支持（同平台可连接多个 OAuth 账号）
- 媒体文件上传
- 批量操作（批量发布/删除）
- 平台级内容/媒体发布校验
- 统一发布服务（即时发布 / Worker 定时发布共用一套逻辑）
- AES-256-GCM 加密存储 OAuth token

## 技术栈
- Next.js 16 (App Router + `proxy.ts`) + React 19
- Tailwind CSS 4
- PostgreSQL 16 + Prisma 7
- BullMQ + Redis 7
- next-intl + SWR + Recharts

## 快速开始

### 前置依赖
- Node.js 20+
- Docker (用于 PostgreSQL 和 Redis)

### 启动

```bash
# 1. 克隆并安装依赖
git clone <repo-url>
cd auto-post
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，至少填入 DATABASE_URL / REDIS_URL / ENCRYPTION_KEY / NEXT_PUBLIC_APP_URL
# 第三方平台 OAuth 凭证现在支持在应用页面里直接填写，普通用户无需改 .env

# 3. 启动数据库和 Redis
docker compose up -d

# 4. 应用数据库迁移
npx prisma migrate deploy

# 5. 启动开发服务器
npm run dev

# 6. （另一个终端）启动 Worker
npm run workers
```

访问 http://localhost:3000

## 环境变量说明

- `DATABASE_URL`：PostgreSQL 连接串，默认开发端口是 `5433`
- `REDIS_URL`：Redis 连接串，默认开发端口是 `6380`
- `ENCRYPTION_KEY`：64 位十六进制密钥，用于加密存储 OAuth token
- `NEXT_PUBLIC_APP_URL`：站点公开地址，OAuth 回调和页面跳转都会用到（仍需在 `.env` 中配置）
- 第三方平台凭证推荐在应用内的“平台凭证”页面填写并保存到数据库
- `.env` 中的以下平台凭证现在只作为兼容回退，不再要求普通用户手改：
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_WEBHOOK_URL`
  - `X_API_KEY`
  - `X_API_SECRET`
  - `LINKEDIN_CLIENT_ID`
  - `LINKEDIN_CLIENT_SECRET`
  - `FACEBOOK_APP_ID`
  - `FACEBOOK_APP_SECRET`
  - `REDDIT_CLIENT_ID`
  - `REDDIT_CLIENT_SECRET`
  - `YOUTUBE_CLIENT_ID`
  - `YOUTUBE_CLIENT_SECRET`

## 账号接入说明

- 先进入侧边栏的“平台凭证”页面，把用户从第三方平台拿到的开发凭证粘贴进去
- LinkedIn / Facebook / Reddit / Twitter / YouTube：凭证保存后，在账号页点击连接，走 OAuth
- Discord：先在“平台凭证”页面填写 `Bot Token` 和 `Webhook URL`，再在账号页点击连接完成落库
- 平台凭证会优先从数据库读取，并用 `ENCRYPTION_KEY` 加密保存；`.env` 只作为兼容回退
- 账号页会显示当前状态：
  - `正常`：可直接发布
  - `即将过期`：Token 快过期，系统会在调用时尝试自动刷新
  - `已过期`：当前不可发布，需要重新授权
  - `待配置`：当前平台开发凭证未配置完整，需先到“平台凭证”页面补齐
  - `需检查`：最近一次 refresh / 发布 / 拉取分析时出现错误

## 发布行为说明

- 即时发布和定时发布共用同一套发布服务
- 创建定时帖子时会先校验平台限制，明显不可发布的内容会直接拦截
- 当前已经实现平台级基础校验：
  - 内容为空
  - 超出平台字数限制
  - 图片 / 视频数量超限
  - 未识别媒体格式
  - 平台媒体上传尚未实现时阻止误发
- 已接入自动错误回写：平台发布失败会回写到帖子平台记录和账号状态

## 项目结构

```
app/           → Next.js 页面 + API 路由（薄层，无业务逻辑）
modules/       → 核心业务逻辑（框架无关）
  posts/       → 帖子 CRUD + 验证
  platforms/   → 平台集成（LinkedIn, Facebook, Discord, Reddit, Twitter, YouTube）
  scheduler/   → BullMQ 队列 + Worker
  analytics/   → 数据分析聚合
  calendar/    → 日历视图
shared/        → 跨模块 UI 组件、Hooks、工具函数
```

依赖方向：`app/` → `modules/` → `shared/`（单向）

## 命令

| 命令 | 说明 |
|------|------|
| npm run dev | 启动开发服务器 |
| npm run build | 生产构建 |
| npm run workers | 启动 BullMQ Worker |
| npm test | 运行测试 |
| npx prisma studio | 数据库 GUI |
| npx prisma migrate deploy | 应用生产/本地迁移 |

## 当前已知限制

- 平台文本发帖链路已打通，但“媒体真正上传到第三方平台”仍未全部实现；当前会在不支持的平台直接阻止发布，避免 silent failure
- 数据分析目前以平台拉取结果为准，不同平台字段能力不同，展示维度会有差异

## License
MIT
