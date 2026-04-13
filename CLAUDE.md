# Auto Post Web

## Project Type
Full-stack Next.js 15 App Router monolith with BullMQ worker process.

## Tech Stack
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS 4, next-intl (i18n)
- Backend: Next.js API Routes
- Database: PostgreSQL 16 + Prisma 7 (@prisma/adapter-pg)
- Queue: BullMQ + Redis 7
- i18n: next-intl with [locale] route segment (zh/en)
- Deploy: Docker Compose (PG:5433, Redis:6380) + `npm run dev`

## Architecture
- `app/[locale]/` — i18n pages (all user-facing routes under locale prefix)
- `app/api/` — API routes (no locale prefix)
- `modules/` — Core business logic (framework-agnostic)
- `shared/` — Cross-module UI components, hooks, utilities
- `i18n/` — Routing, navigation, request config
- `messages/` — zh.json, en.json translation files
- Direction: app/ → modules/ → shared/ (one-way dependency)

## Design Style
Notion-inspired: white base (#FFFFFF), light gray borders (#E8E8E8), dark text (#37352F), blue accent (#2383E2), 3-4px border radius, 8px spacing grid.

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run workers` — Start BullMQ workers (publish + analytics sync)
- `npm test` — Run tests with vitest
- `npx prisma migrate dev` — Run migrations
- `npx prisma studio` — Database GUI
- `docker compose up -d` — Start PostgreSQL + Redis

## Platforms
6 platforms implemented: LinkedIn, Facebook, Discord, Reddit, Twitter/X, YouTube
- All implement PlatformClient interface via registry pattern
- Twitter uses OAuth 2.0 PKCE with dedicated routes
- Discord uses Bot Token (no OAuth)
- Others use standard OAuth 2.0

## Conventions
- Module internal: direct imports
- Module-to-module: import exported service functions
- platforms module: all implement PlatformClient interface
- All tables have userId field (default "default") for future multi-user
- OAuth tokens encrypted with AES-256-GCM (random nonce per encryption)
- All user-facing strings use next-intl useTranslations() hook
- Use `@/i18n/navigation` Link/useRouter (not next/navigation) for locale-aware routing
