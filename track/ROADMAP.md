# Roadmap

## v1.0 — Core ✅
- [x] 设计文档完成
- [x] 实现计划完成
- [x] Tier-1 平台代码：LinkedIn, Facebook, Discord, Reddit
- [x] 发帖：即时 + 定时（BullMQ）
- [x] 草稿管理
- [x] 内容日历（月视图）
- [x] 数据分析仪表盘
- [x] Notion 风格 UI（8 页面）
- [x] 连接真实数据库 E2E 验证

## v1.1 — 功能补全 ✅
- [x] Toast 全局通知系统 (sonner)
- [x] Analytics 定时同步 (BullMQ 每小时)
- [x] LinkedIn Token 自动刷新
- [x] LinkedIn/Discord Analytics 真实 API
- [x] 平台删帖接入 UI（远端 + 本地同步删除）
- [x] 媒体文件上传（本地存储 + 图片预览）
- [x] Post 编辑页完善（平台徽章 + 字数统计）
- [x] 批量操作（批量发布/删除）
- [x] Twitter/X 集成（OAuth 2.0 PKCE + v2 API）
- [x] YouTube 集成（Google OAuth + Data API v3）
- [x] i18n 双语（中文/英文，next-intl）
- [x] Docker Compose 配置 (PostgreSQL + Redis)
- [x] .env.example + README

## v1.1.1 — UI 打磨 + i18n 深化 ✅
- [x] date-fns 中文日期格式化（useFormatDate hook，4 页面适配）
- [x] 账号页 UI 重设计（Notion 风格网格卡片 + 品牌色左边框 + 虚线空状态）
- [x] 平台名中文化（品牌名 + 中文副标题，zh locale 专属）
- [x] Discord 弹窗优化（品牌色头部 + 深色代码块）
- [x] 关闭 Next.js DevTools（devIndicators: false）
- [x] 翻译文件新增 platform namespace（zh: 领英/推特/脸书/油管）

## v1.1.2 — 账号稳定性 + 发布守卫 ✅
- [x] OAuth Token 加密存储后的统一解密/自动刷新
- [x] Worker / 即时发布统一走发布服务
- [x] YouTube 平台注册补齐
- [x] OAuth state 校验 + locale 回跳
- [x] Discord 手动接入 API 闭环
- [x] 多账号连接支持（非 Discord 平台）
- [x] 账号状态展示（正常 / 即将过期 / 已过期 / 待配置 / 需检查）
- [x] 平台级内容/媒体发布校验 + 前端错误回显
- [x] Next.js `middleware` → `proxy` 迁移

## v1.1.3 — OAuth 连接修复 ✅
- [x] Twitter/X 清理遗留 PKCE 内存状态
- [x] 通用 OAuth 路由改为对 Twitter / Facebook 早返回到专属入口
- [x] Facebook OAuth 改为 Page 授权与 Page token 存储
- [x] Facebook 多 Page 选择页与 API
- [x] Facebook Page 模式资料读取 / refresh 适配
- [x] 账号页 Facebook OAuth 错误提示与翻译补齐

## v1.2 — Tier-3 平台 + 多用户
- [ ] Instagram 集成（Business 账号 + 异步两步发布）
- [ ] TikTok 集成（需 App 审核）
- [ ] 多用户认证系统
- [ ] 用户数据隔离

## v2.0 — 架构升级
- [ ] 前后端分离（Next.js + NestJS）
- [ ] 团队协作 + 角色权限
- [ ] MCP Server 接口
