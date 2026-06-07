# Contributing to TaskScore AI

## Development Setup

See [README.md](./README.md) for full local setup instructions.

## Workflow

1. Create a branch: `git checkout -b feat/your-feature`
2. Make changes, write tests where applicable
3. `pnpm lint && pnpm typecheck` must pass
4. Open a PR against `main`

PRs require passing CI (lint, typecheck, unit tests). E2E tests run on merge.

## Code Conventions

- **Imports**: Always import Prisma from `@/lib/db`, never from `@prisma/client` directly
- **Server components**: Default — only add `"use client"` when you need browser APIs or React state
- **Styling**: Tailwind v4 utility classes only; zinc palette; no inline styles; no `tailwind.config.ts`
- **Dark mode**: Forced via `<html class="dark">` — never use `dark:` variants conditionally
- **shadcn/ui**: Add components via `pnpm dlx shadcn@latest add <component>` from `apps/web`

## Adding Content (Domains / Categories / Tasks)

All content is managed through the Prisma seed script at `packages/database/prisma/seed.ts`.

1. Edit `seed.ts` to add your domain, categories, or tasks
2. Run `pnpm --filter @taskscore/database db:seed` locally to verify
3. In production, re-run the seed after deploying (seed uses upsert, so it's safe to re-run)

Task fields:
- `editorScore` (1–5): The editorial assessment of AI capability on this task
- `rationale` (markdown): Why this score was assigned
- `useCases` (markdown): Real-world scenarios where this task appears
- `resources` (JSON): `[{ "title": "...", "url": "..." }]` — links for further reading
- `publishedAt`: Set to a date to make the task visible; `null` = draft

## Database Migrations

When changing `packages/database/prisma/schema.prisma`:

```bash
cd packages/database

# Create and apply a new migration locally
npx prisma migrate dev --name describe_the_change

# Verify the generated SQL in prisma/migrations/<timestamp>_describe_the_change/migration.sql
# Commit both the schema change and the migration file
```

To deploy migrations to production:

```bash
# From repo root, pointing at production DATABASE_URL / DIRECT_URL
pnpm db:migrate
```

Never edit existing migration files — always create a new migration.

## The 1–5 Readiness Scale

The scale labels appear in two places that **must stay in sync**:

| File | Variable | Used for |
|---|---|---|
| `apps/web/src/components/task/vote-form.tsx` | `SCORE_LABELS` | Rating UI (label + hint) |
| `apps/web/src/app/page.tsx` | `SCALE` | Marketing page |

Labels: **1 Failing · 2 Marginal · 3 Functional · 4 Proficient · 5 Expert-grade**

## Testing

- **Unit tests** (`src/__tests__/unit/`): Pure functions, no React
- **Component tests** (`src/__tests__/components/`): Client components with React Testing Library
- **API tests** (`src/__tests__/api/`): Route handlers with mocked Prisma + Supabase; use `@vitest-environment node` docblock
- **E2E** (`e2e/`): Playwright against a running dev server with seeded DB

Run before pushing:

```bash
cd apps/web
pnpm test          # unit + component + api
pnpm typecheck     # from repo root: pnpm typecheck
```

When adding a new utility function, add a unit test. When adding a client component with user interaction, add a component test. Route handler changes need an API test.
