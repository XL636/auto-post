# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Design spec document (2026-04-10)
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
