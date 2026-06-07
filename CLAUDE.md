# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (runs across all packages via Turborepo)
```bash
pnpm dev          # start all dev servers
pnpm build        # build all packages
pnpm lint         # lint all packages
pnpm typecheck    # type-check all packages
pnpm db:generate  # regenerate Prisma client after schema changes
pnpm db:migrate   # deploy pending migrations (production-safe)
```

### Web app (`apps/web`)
```bash
pnpm test              # run Vitest unit + component tests (no server needed)
pnpm test:watch        # watch mode
pnpm test:coverage     # with lcov coverage report
pnpm test:e2e          # Playwright E2E (requires dev server + seeded DB)
pnpm test:e2e:ui       # Playwright interactive UI
```

### Database package (`packages/database`)
```bash
# Run from packages/database — needs DATABASE_URL and DIRECT_URL in packages/database/.env
npx prisma migrate dev --name <name>   # create + apply a new migration
npx prisma db seed                     # alias: pnpm db:seed (uses tsx)
npx prisma studio                      # visual DB browser
```

### Running a single Vitest test file
```bash
cd apps/web && pnpm vitest run src/__tests__/api/votes.test.ts
```

## Architecture

### Monorepo layout
```
taskscore-ai/
  apps/web/           — Next.js 15 App Router (the only app)
  packages/database/  — Prisma schema, generated client, seed script
```

`packages/database` exports a singleton PrismaClient via `./src/index.ts`. The web app imports it through `@/lib/db` which simply re-exports from `@taskscore/database`. Never import from `@prisma/client` directly in the web app.

### Data model (three-level taxonomy)
```
Domain → Category → Task
```
- `Domain` (e.g. "Software Engineering", "Legal") — top-level grouping, has a `slug` and `sortOrder`
- `Category` — belongs to a Domain, has a unique `[domainId, slug]` compound key
- `Task` — belongs to a Category; has `editorScore` (1–5 Int), `prompt`, `expectedOutput`, `publishedAt` (null = draft), and three optional editorial fields: `rationale` (markdown), `useCases` (markdown), `resources` (Json — `[{ title, url }]`)
- `Vote` — one per `[taskId, userId, aiModelId]` (compound unique); users rate 1–5; community score is computed at query time via `prisma.vote.groupBy`
- `AiModel` — controlled vocabulary seeded upfront; never created by users

### Next.js route structure
```
app/
  layout.tsx               — minimal root: html/body/fonts/globals.css only
  page.tsx                 — public marketing landing page (no sidebar)
  auth/
    login/page.tsx         — OAuth via Supabase server actions (GitHub + Google)
    callback/route.ts      — exchanges OAuth code; upserts User into public.users; redirects to first domain
  (app)/                   — route group with sidebar shell layout
    layout.tsx             — fetches domains for sidebar; wraps with SidebarProvider + Header
    (matrix)/
      [domain]/page.tsx    — domain matrix; reads ?category= param to filter rows server-side
      [domain]/[category]/[task]/page.tsx — dual-pane task detail
    profile/page.tsx       — user's vote history; redirects to login if unauthenticated
  api/
    votes/route.ts         — POST only; Zod-validated; requires auth; calls prisma.vote.upsert
```

The `(app)` route group provides the sidebar + header shell. Pages outside it (`/`, `/auth/*`) render without a sidebar.

### Auth flow
Supabase handles OAuth. The middleware (`src/middleware.ts` → `src/lib/supabase/middleware.ts`) refreshes sessions on every request. The `/auth/callback` route also upserts the Supabase user into the Prisma `users` table (required for Vote FK constraints). Env vars needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

### Styling
Tailwind CSS v4 (CSS-first config via `globals.css` — no `tailwind.config.ts`). Dark mode is forced via `<html class="dark">`. All UI uses the zinc palette. shadcn/ui v4 with the Radix Nova preset. Do not add a `tailwind.config.ts`.

### Readiness scale
The 1–5 scale labels are defined in two places that must stay in sync:
- `apps/web/src/components/task/vote-form.tsx` — `SCORE_LABELS` (label + hint, used in the rating UI)
- `apps/web/src/app/page.tsx` — `SCALE` (label + desc, used on the marketing page)

Labels: 1 Failing · 2 Marginal · 3 Functional · 4 Proficient · 5 Expert-grade

### Testing conventions
- **Unit/component tests**: Vitest + React Testing Library in `src/__tests__/`
  - `unit/` — pure functions (no React)
  - `components/` — client components only (server components are covered by E2E)
  - `api/` — route handlers with mocked Prisma and Supabase; use `@vitest-environment node` docblock
- **E2E**: Playwright in `e2e/`; requires seeded DB; data-dependent assertions use `test.skip()` guards
- Radix UI pointer-event polyfills are set up in `src/__tests__/setup.ts` (guarded for non-browser envs)
- API route mocks use `vi.hoisted()` to avoid temporal dead zone issues with `vi.mock` hoisting

### Environment variables
Two `.env` files are required:
- `apps/web/.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- `packages/database/.env` — `DATABASE_URL` (pooled, for Prisma queries) and `DIRECT_URL` (direct, for migrations)
