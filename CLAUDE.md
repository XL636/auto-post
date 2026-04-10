# Auto Post Web

## Project Type
Full-stack Next.js 15 App Router monolith with BullMQ worker process.

## Tech Stack
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS 4, shadcn/ui
- Backend: Next.js API Routes
- Database: PostgreSQL 16 + Prisma 6
- Queue: BullMQ + Redis 7
- Deploy: Direct on Mac (`npm install && npm run dev`)

## Architecture
- `app/` — Next.js pages + API routes (thin layer, no business logic)
- `modules/` — Core business logic (framework-agnostic)
- `shared/` — Cross-module UI components, hooks, utilities
- Direction: app/ → modules/ → shared/ (one-way dependency)

## Design Style
Notion-inspired: white base (#FFFFFF), light gray borders (#E8E8E8), dark text (#37352F), blue accent (#2383E2), 3-4px border radius, 8px spacing grid.

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm test` — Run tests with vitest
- `npx prisma migrate dev` — Run migrations
- `npx prisma studio` — Database GUI

## Conventions
- Module internal: direct imports
- Module-to-module: import exported service functions
- platforms module: all implement PlatformClient interface
- All tables have userId field (default "default") for future multi-user
- OAuth tokens encrypted with AES-256-GCM (random nonce per encryption)
