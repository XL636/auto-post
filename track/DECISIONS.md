# Architecture Decisions

## D-001: 方案 C — Next.js 全栈 + BullMQ
**日期**: 2026-04-10
**决策**: 选择 Next.js 全栈单体 + BullMQ + Redis，而非前后端分离（方案 B）或纯 node-cron（方案 A）
**理由**: 一套代码开发效率高，BullMQ 保证定时可靠性，后续可平滑迁移到方案 B
**替代方案**: 方案 A（node-cron，定时不可靠），方案 B（NestJS 分离，自用太重）

## D-002: 分模块架构
**日期**: 2026-04-10
**决策**: 业务逻辑放 modules/，与 Next.js 框架解耦
**理由**: 后续迁移到方案 B 时 modules/ 可直接搬到 NestJS，前端代码不动
**约束**: app/ 只做路由转发，不写业务逻辑

## D-003: 平台分 Tier 实现
**日期**: 2026-04-10
**决策**: Tier-1（LinkedIn/Facebook/Discord/Reddit）先做，Tier-2/3 后续版本
**理由**: Twitter 需付费、Instagram 仅 Business 账号、TikTok 未审核内容私有
**来源**: 对抗性审查发现的 API 接入障碍

## D-004: 独立 Worker 进程
**日期**: 2026-04-10
**决策**: BullMQ Worker 作为独立 Docker 容器运行，不与 Next.js 同进程
**理由**: Next.js 可能冷启动/重启，Worker 需常驻。分离后互不影响
**来源**: 对抗性审查 W1

## D-005: AES-256-GCM + 随机 Nonce
**日期**: 2026-04-10
**决策**: OAuth Token 用 AES-256-GCM 加密，每次加密生成随机 12-byte nonce，nonce+tag+ciphertext 拼接存储
**理由**: GCM nonce 复用会导致安全性归零，必须每次随机
**来源**: 对抗性审查 W3
