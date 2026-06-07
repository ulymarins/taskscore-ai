# TaskScore AI

A community-driven benchmark for AI task readiness. Editors score AI outputs 1–5 across professional domains; the community scores the same tasks against real AI models, surfacing where AI actually delivers and where it still fails.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Database | Supabase (PostgreSQL via Prisma 5) |
| Auth | Supabase OAuth (GitHub + Google) |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Monorepo | Turborepo + pnpm workspaces |
| Hosting | Vercel |

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- A GitHub or Google OAuth app (for auth)

## Local Development

### 1. Clone and install

```bash
git clone git@github.com:ulymarins/taskscore-ai.git
cd taskscore-ai
pnpm install
```

### 2. Configure environment variables

**`apps/web/.env.local`** (copy from `apps/web/.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**`packages/database/.env`** (copy from `packages/database/.env.example`):

```bash
# Transaction mode (port 6543) — runtime queries via PgBouncer
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode (port 5432) — used by prisma migrate only
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Find both values in Supabase → Project Settings → Database → Connection string.

### 3. Set up the database

```bash
# Apply all migrations
pnpm db:migrate

# Seed AI models and initial domain content
pnpm --filter @taskscore/database db:seed
```

### 4. Configure Supabase Auth

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

For OAuth providers (Authentication → Providers):

- **GitHub**: Create an OAuth App at github.com/settings/developers; set callback to `https://[project-ref].supabase.co/auth/v1/callback`
- **Google**: Create credentials in Google Cloud Console; same callback URL pattern

### 5. Install the user-sync trigger

Run this SQL in Supabase Dashboard → SQL Editor once per project:

```sql
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, "avatarUrl", role, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url',
    'COMMUNITY',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    name       = EXCLUDED.name,
    "avatarUrl" = EXCLUDED."avatarUrl",
    "updatedAt" = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_change();

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_change();
```

> This trigger keeps `public.users` in sync with Supabase's `auth.users` automatically — no app-level upsert needed.

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
cd apps/web

pnpm test            # unit + component tests (Vitest)
pnpm test:watch      # watch mode
pnpm test:coverage   # with coverage report
pnpm test:e2e        # Playwright E2E (requires running dev server + seeded DB)
```

## Database Workflow

```bash
# After editing packages/database/prisma/schema.prisma:
pnpm db:generate                                               # regenerate Prisma client
cd packages/database && npx prisma migrate dev --name <name>   # create + apply migration

# Deploy pending migrations to production:
pnpm db:migrate
```

## Production Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel
2. Set all env vars from step 2 above (using production values — `NEXT_PUBLIC_SITE_URL=https://taskscore.ai`)
3. Vercel picks up `vercel.json` at the root — no further build config needed
4. Run `pnpm db:migrate` from your local machine (pointing at production `DIRECT_URL`) after each schema change
5. In Supabase Dashboard → Authentication → URL Configuration, add `https://taskscore.ai` as Site URL and `https://taskscore.ai/auth/callback` as a redirect URL

## Project Structure

```
taskscore-ai/
  apps/web/               — Next.js 15 app
    src/
      app/                — App Router routes
        (app)/            — Authenticated shell (sidebar + header)
        auth/             — Login + OAuth callback
        api/votes/        — Vote submission API
      components/         — UI components
      lib/                — Supabase client, Prisma re-export, utilities
      __tests__/          — Vitest unit + component + API tests
    e2e/                  — Playwright E2E tests
  packages/database/      — Prisma schema, generated client, seed script
```
