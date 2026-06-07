# TaskScore.ai Architecture Analysis

This document provides a summary of the pros and cons of the current architecture of **TaskScore.ai**, specifically evaluating its readiness as a state-of-the-art open-source project.

---

## Technical Overview
*   **Monorepo**: Turborepo + `pnpm` workspace
*   **Frontend**: Next.js 15 (App Router, React Server Components, Tailwind CSS v4)
*   **Database**: PostgreSQL + Prisma ORM
*   **Auth**: Supabase Auth (integrated via `@supabase/ssr` / `@supabase/supabase-js`)

---

## Pros: What the Architecture Gets Right

### 1. Modern Next.js 15 / RSC Paradigm
*   **Performance**: Renders pages on the server (RSC) to minimize bundle sizes and fetch database content directly (e.g., in `DomainPage` and `TaskPage`), making the UI fast and SEO-friendly out of the box.
*   **Turbopack Integration**: Next.js config uses Turbopack (`next dev --turbopack`) for fast hot-module reloading during local development.

### 2. High-Quality Monorepo Configuration
*   **Package Splitting**: Separating database logic (`@taskscore/database`) from frontend logic (`@taskscore/web`) is excellent. It allows easily adding future apps (e.g., admin panels, analytical services, Python-based evaluation engines) without bloating the frontend.
*   **Fast Builds**: Turborepo optimizes builds and caching, meaning contributions build quickly in CI and local machines.

### 3. Tailwind CSS v4.0.0
*   Using Tailwind CSS v4 utilizes the newest compiler, which parses CSS significantly faster, removes the need for complex configurations (`tailwind.config.js` is replaced by standard CSS directives), and aligns with modern CSS spec features.

### 4. Prisma Schema Design
*   The schema is clean, well-indexed, and self-documenting. 
*   **Seed Script**: The presence of `packages/database/prisma/seed.ts` is fantastic for seeding mock database records (Domains, Categories, Tasks, AiModels) so new contributors can immediately view a populated interface.

---

## Cons: Friction Points for Open-Source Contributions

### 1. Missing Test Suite (Critical)
*   **Problem**: There are zero tests (unit, integration, or E2E) configured in the monorepo.
*   **Impact on Open-Source**: Essential for scaling open source. Without testing tools (e.g., Vitest for units/API and Playwright/Cypress for UI flows), you cannot verify if a contributor's PR breaks core functionality (like voting or route parsing).

### 2. Supabase Integration Overhead & Friction
*   **Problem**: Authentic user votes rely on Supabase Auth. Setting up Supabase requires environment keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and authentication callback configurations.
*   **Impact on Open-Source**: Contributors must set up their own personal Supabase instances or rely on Docker/Supabase CLI locally, which is currently undocumented and unscripted. 

### 3. Fragile User Sync Flow
*   **Problem**: Users are synced into the public `users` table via `prisma.user.upsert` inside the `/auth/callback/route.ts` API route.
*   **Impact**: If a user updates their email or avatar in Supabase (or registers in another way), the public database won't sync automatically. Real-time sync is better handled by a PostgreSQL database trigger/function (listening to changes in schema `auth` and copying to `public`).

### 4. Developer Experience & Tooling Gaps
*   **No Pre-commit hooks**: No Husky/Lint-Staged configured to format code before commits.
*   **No CI/CD configuration**: The project lacks a `.github/workflows` setup to verify typescript type-checking, linting, or database migrations on incoming PRs.
*   **No root README or CONTRIBUTING.md**: Contributors have no onboarding instructions or contribution guidelines.

---

## Recommendations to Achieve "State-of-the-Art"

To attract and retain contributors, the architecture needs to minimize friction and maximize confidence. 

### Phase 1: DX & CI/CD (Low effort, High impact)
1.  **Add Documentation**: Create a comprehensive root `README.md` and a `CONTRIBUTING.md` outlining the local setup steps.
2.  **Add GitHub Actions Workflow**: Configure a workflow that runs `pnpm build`, `pnpm lint`, and `pnpm typecheck` on every PR.
3.  **Setup Code Formatting**: Enforce Prettier and a solid ESLint config using pre-commit hooks to keep code formatting uniform.

### Phase 2: Testing Infrastructure (Medium effort, Critical)
1.  **Add Vitest**: Setup Vitest in `apps/web` and `packages/database` for fast unit tests.
2.  **Add Playwright**: Configure Playwright for end-to-end tests (e.g., simulating the user signing in, navigating tasks, and submitting a vote).

### Phase 3: Local Dev Automation (Medium effort)
1.  **Docker Compose / Local Supabase**: Provide a `docker-compose.yml` to spin up a local PostgreSQL DB along with instructions for starting a local Supabase emulator.
2.  **Robust Syncing**: Migrate the user sync logic from the `/auth/callback` endpoint into a SQL migration trigger on the database level.
