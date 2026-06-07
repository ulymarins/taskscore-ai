import { PrismaClient } from "../generated/client"

const prisma = new PrismaClient()

const SEED_DATA = [
  {
    name: "Software Engineering",
    slug: "software-engineering",
    description: "AI capability in software development, architecture, testing, and operations.",
    categories: [
      {
        name: "Code Review & Auditing",
        slug: "code-review",
        sortOrder: 1,
        tasks: [
          {
            name: "Identify SQL injection risk",
            slug: "identify-sql-injection-risk",
            description: "Review a code snippet and identify SQL injection vulnerabilities, explaining the risk and providing a parameterized query fix.",
            prompt: "Review the following code for SQL injection vulnerabilities.\n\nFor each vulnerability found:\n1. Quote the exact vulnerable line(s)\n2. Explain the attack vector\n3. Provide a corrected version using parameterized queries\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "A structured review listing each vulnerable line, the injection vector, and a corrected parameterized version. Should catch all string interpolation into SQL strings.",
            editorScore: 5,
            notes: "Strong on direct concatenation across Python, JS, PHP, Go, Ruby. Weaker on second-order injection (data sanitized on write, concatenated on read) and on detecting when an ORM `.raw()` or `.execute()` accepts user input through a wrapper.",
            rationale: "Catches first-order interpolation in any mainstream language with near-perfect reliability — the `f\"...{user_input}...\"` → `cursor.execute(query)` pattern is essentially a pattern-match, and the model produces the correct parameterized rewrite without prompting. Where it gets weaker is second-order injection (input sanitized when stored, concatenated when retrieved) and ORM raw-query escape hatches that read like safe ORM calls. For a first-pass PR check, it's production-ready; for an audit of a system with a known multi-step data flow, treat it as one signal among several.",
            useCases: "Pre-commit Semgrep-style sanity check; first pass on a PR review bot; teaching juniors why `cursor.execute(f'SELECT ... {x}')` is bad and what the fix looks like."
          },
          {
            name: "Review for race conditions",
            slug: "review-for-race-conditions",
            description: "Analyze concurrent or async code and identify potential race conditions, explaining when the hazard occurs and how to fix it with proper synchronization.",
            prompt: "Review the following concurrent code for race conditions and thread-safety issues.\n\nFor each issue:\n1. Identify the specific lines involved\n2. Describe the exact scenario in which the race occurs\n3. Suggest a fix (mutex, atomic, channel, etc.)\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of all shared-state hazards, timing-dependent bugs, and unsafe concurrent access patterns with correct synchronization fixes.",
            editorScore: 2,
            notes: "Reliably flags shared mutable state — a goroutine writing to a map, two threads incrementing a counter. Misses: TOCTOU on filesystem ops, async/await interleaving at await boundaries, transaction isolation-level bugs, and distributed locking issues.",
            rationale: "Catches the easy cases — goroutine writing to a shared map, two threads both reading-then-writing a counter, missing mutex on a struct field. Falls apart on TOCTOU patterns (check-then-act on the filesystem), async/await interleaving where state changes between awaits, and any race that involves a database isolation level or distributed lock. Without an actual model of concurrent execution, the analysis is pattern-matching on 'this looks like a race' rather than tracing real interleavings. Useful as a smell-check on a PR; not safe as a sole guardrail for concurrency-critical code paths.",
            useCases: "First-pass smell check on PR diffs touching concurrency; teaching juniors what a race even looks like; generating a list of things to verify with a real concurrency tool (race detector, ThreadSanitizer)."
          },
          {
            name: "Check for memory leaks",
            slug: "check-for-memory-leaks",
            description: "Review C++ or Go allocation code and detect missing frees, unclosed file descriptors, or dangling references.",
            prompt: "Analyze this code for potential memory leaks, unclosed streams/handles, or resource leaks. Recommend proper cleanup blocks.\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "Detailed detection of unreleased resources (e.g. unclosed file descriptors, missing delete commands) with equivalent try-finally/defer code fixes.",
            editorScore: 3,
            notes: "Reliable on syntactic patterns (missing defer/close/free, open() without context manager). Misses heap lifetime issues — circular references in reference-counted languages, retained closures capturing large state, custom allocator/arena lifetime bugs.",
            rationale: "Syntactic resource leaks land — `open()` without `with`, `fopen` without `fclose`, missing `defer` after a `os.Open`, manual `new` without matching `delete`. What it cannot do is heap lifetime analysis: a circular reference between two retained objects in a refcounted language reads as 'fine' because every line looks correct in isolation. Same for closures that accidentally capture and retain a huge buffer, or custom arena allocators where lifetime is governed by a higher-level data structure. A static eyeball pass; no substitute for a profiler when the leak is non-obvious.",
            useCases: "Catching the obvious 'forgot to close the file' bug; teaching the with/defer/RAII pattern; first-pass review of resource-handling code before manual review."
          }
        ]
      },
      {
        name: "DevOps & CI/CD",
        slug: "devops",
        sortOrder: 2,
        tasks: [
          {
            name: "Write Prometheus alert rules",
            slug: "write-prometheus-alert-rules",
            description: "Given a service SLA and failure conditions, generate a valid Prometheus alerting rule YAML file with appropriate thresholds and labels.",
            prompt: "Write a Prometheus alerting rule file in YAML for the following scenario:\n\n{{SCENARIO}}\n\nRequirements:\n- Use 'groups' structure\n- Include 'for' duration to avoid flapping\n- Add severity label (critical / warning)\n- Add a runbook_url annotation placeholder\n\nReturn only valid YAML.",
            expectedOutput: "A syntactically valid Prometheus alert rule YAML with at least one alert group, correct PromQL expressions, duration guards, and severity + runbook_url annotations.",
            editorScore: 3,
            notes: "YAML structure, PromQL syntax, severity labels, runbook_url annotation: all correct first try. Thresholds (>0.95 error rate, >500ms p99) and `for:` durations (5m, 10m) are textbook defaults with no relationship to your service's actual SLO.",
            rationale: "The boilerplate is essentially perfect — `groups`, `rules`, `expr`, `for`, `labels.severity`, `annotations.summary/description/runbook_url`. PromQL syntax (rate(), histogram_quantile(), the by/without clauses) compiles first try. The unsolved problem is everything that requires knowing your service: thresholds default to textbook values (`> 0.95` error rate, `> 500ms` p99, `for: 5m`), which have no relationship to what your service actually does at baseline. The output is a deployable-shaped skeleton, not a deployable rule — treat the numbers as TODOs.",
            useCases: "Bootstrapping a new alert group when you remember the structure but not the YAML keys; teaching PromQL+rule syntax to someone new; converting a 'we need an alert for X' Slack thread into a starter PR."
          },
          {
            name: "GitHub Actions workflow for monorepo",
            slug: "github-actions-monorepo",
            description: "Create an optimized GitHub Actions YAML pipeline that runs build, lint, and test tasks for changed packages inside a Turborepo.",
            prompt: "Write a GitHub Actions YAML workflow that builds and tests a Turborepo monorepo. Optimize it by:\n- Caching pnpm store\n- Caching Turborepo builds\n- Only running tests on modified packages using turbo filter.",
            expectedOutput: "Valid YAML containing caching action hooks for pnpm and turbo, using turbo run build --filter=[changed] to speed up execution.",
            editorScore: 4,
            notes: "Action structure and cache configuration land cleanly. Two traps: (1) frequently pins outdated action versions (`actions/cache@v3`, `pnpm/action-setup@v2`) after newer majors ship; (2) the 'filter changed packages' syntax is often written as a placeholder like `--filter=[changed]` that isn't real turbo syntax — the actual form is git-ref based (`--filter=...[origin/main]`).",
            rationale: "Cache configuration and the pnpm + turbo orchestration come out right — `actions/setup-node` with `cache: 'pnpm'`, the turbo remote-cache token block, the dependency install step. The trap is action versions: the model frequently outputs `actions/cache@v3` or `pnpm/action-setup@v2` after newer majors ship, because the training set has more historical examples than current ones. The turbo filter syntax is also a recurring source of friction — `--filter=[changed]` isn't real turbo and you'll get a runtime error; the actual form is git-ref based (`--filter=...[origin/main]`). Treat the YAML as a structural template and validate every pinned version and filter expression against your repo's actual versions.",
            useCases: "Bootstrapping CI on a new monorepo; migrating from npm/yarn to pnpm + turbo; producing a starter workflow you then update with current action versions."
          },
          {
            name: "Docker multi-stage build",
            slug: "docker-multi-stage-build",
            description: "Create an optimized, secure Dockerfile for a Next.js application using multi-stage builds to minimize output image size.",
            prompt: "Create a multi-stage Dockerfile for a Next.js application. Ensure it runs as a non-root user, optimizes node_modules caching, and outputs a minimal image.",
            expectedOutput: "A Dockerfile with separate builder and runner stages, setting PORT, NODE_ENV, copying runner outputs, and switching USER to node.",
            editorScore: 4,
            notes: "Multi-stage structure, non-root user, NODE_ENV, EXPOSE all clean. Next.js-specific gotcha: the Dockerfile assumes `output: 'standalone'` is set in `next.config.js` but rarely calls it out, so the `COPY .next/standalone ./` step silently fails on a config that hasn't enabled it.",
            rationale: "Multi-stage skeleton lands clean — separate `deps`, `builder`, `runner` stages, non-root `node` user, `NODE_ENV=production`, `EXPOSE 3000`, `--chown=node:node` on the copies. The Next.js-specific failure is the standalone-output assumption: the template usually copies from `.next/standalone/` and `.next/static/`, but that directory only exists if you've set `output: 'standalone'` in `next.config.js`. The Dockerfile rarely flags this prerequisite, so you build the image, run it, and get a confusing 'file not found' from the entrypoint. Otherwise: production-ready.",
            useCases: "Containerizing a Next.js service for the first time; producing a small image for a Vercel-alternative deployment; learning the multi-stage pattern from a working template."
          }
        ]
      }
    ]
  },
  {
    name: "Data Science & Analytics",
    slug: "data-science",
    description: "Data processing, statistical analysis, database queries, and visualization.",
    categories: [
      {
        name: "SQL Generation & Optimization",
        slug: "sql-queries",
        sortOrder: 1,
        tasks: [
          {
            name: "Generate recursive CTE query",
            slug: "generate-recursive-cte-query",
            description: "Write a SQL query using recursive Common Table Expressions to compute organizational trees, manager reporting loops, or nested parts.",
            prompt: "Write a PostgreSQL query using a recursive CTE to trace the full management chain for user ID {{USER_ID}} in a table `employees` with columns `id`, `name`, and `manager_id`.",
            expectedOutput: "Valid SQL containing WITH RECURSIVE, a base case SELECT query, an UNION ALL, and an inner JOIN back to the CTE.",
            editorScore: 4,
            notes: "Correct WITH RECURSIVE / UNION ALL / self-join shape lands first try. Two gotchas: (1) no cycle guard by default — if `manager_id` data forms a loop, infinite recursion; (2) occasionally inverts the join direction so you get reports-to instead of reports-of. Read the join before trusting it.",
            rationale: "The WITH RECURSIVE / base-case / UNION ALL / self-join pattern is essentially a memorized template — comes out syntactically correct on the first attempt with sensible column aliases and a usable depth counter. Two recurring weaknesses: it almost never includes cycle detection (a `WHERE NOT id = ANY(path)` guard or a `depth < N` cap), so a malformed `manager_id` chain causes infinite recursion; and it occasionally inverts the recursive join direction, giving you direct reports instead of the management chain (or vice versa). Read the join condition carefully before deploying.",
            useCases: "Org chart traversal; bill-of-materials tree; comment thread recursion; any acyclic hierarchy. Skip when the underlying graph could have cycles unless you add the guard yourself."
          },
          {
            name: "Optimize slow JOIN query",
            slug: "optimize-slow-join-query",
            description: "Analyze a slow query with multiple JOINs and subqueries and rewrite it for maximum speed, adding index recommendations.",
            prompt: "Analyze this query and suggest optimizations:\nSELECT u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.created_at > NOW() - INTERVAL '30 days' GROUP BY u.name;\n\nIdentify bottlenecks and write a faster version.",
            expectedOutput: "Suggested index on orders(user_id, created_at) and orders table filtering before grouping, or equivalent performance improvements.",
            editorScore: 3,
            notes: "Strong on anti-pattern recognition (the LEFT JOIN + WHERE-on-right-table trap that silently demotes to INNER, missing composite indexes, GROUP BY on a non-key column). Completely blind to your actual data — table sizes, existing indexes, cardinality, planner stats — so suggestions are hypotheses, not answers.",
            rationale: "Catches the textbook foot-guns reliably: the `LEFT JOIN orders o ... WHERE o.created_at > ...` pattern (which silently demotes to INNER because the predicate filters out the NULL rows from the outer side), the missing composite index on `(user_id, created_at)`, and `GROUP BY u.name` on a non-indexed string instead of `u.id`. What it cannot do is reason about your data: it suggests a composite index without knowing whether you already have it, doesn't know your table sizes, and can't see whether the planner has chosen a hash join or a nested loop. Treat the output as a checklist of hypotheses to validate with EXPLAIN ANALYZE, not as a finished optimization.",
            useCases: "First-pass investigation of a slow query before opening EXPLAIN; generating an index hypothesis to test; teaching team members what query anti-patterns even look like."
          },
          {
            name: "JSON column indexing and query",
            slug: "json-column-query",
            description: "Write SQL queries that extract values from nested JSONB structures in PostgreSQL, utilizing GIN indices for speed.",
            prompt: "Write a query to search a table `products` with a JSONB column `metadata` for entries where `metadata -> 'attributes' ->> 'color'` is 'blue'. Write the GIN index creation command too.",
            expectedOutput: "Query using `metadata @>` or `->>` syntax and `CREATE INDEX ... ON products USING gin (...)` command.",
            editorScore: 3,
            notes: "Operator and index syntax both correct in isolation. Persistent failure: pairs an `->>` extraction query with a plain GIN(metadata) index that won't actually serve the query — you need either to rewrite as `@>` containment (which uses jsonb_path_ops GIN) or build an expression index on the specific path. Output rarely flags this.",
            rationale: "Both pieces look right on inspection — `WHERE metadata -> 'attributes' ->> 'color' = 'blue'` is valid SQL and `CREATE INDEX ... USING gin (metadata)` is a valid index — but together they don't accelerate the query. A plain GIN on a jsonb column serves containment (`@>`) lookups, not arrow-operator path extraction. To actually use an index for the extraction query, you need either to rewrite as `WHERE metadata @> '{\"attributes\": {\"color\": \"blue\"}}'::jsonb` (which the GIN can serve) or build a separate expression index: `CREATE INDEX ... ON products ((metadata -> 'attributes' ->> 'color'))`. The model almost never surfaces this mismatch, so you ship a 'GIN-indexed query' that does a sequential scan.",
            useCases: "Querying event payloads stored as JSONB; metadata filters on a generic catalog table; learning when `@>` containment beats `->>` extraction for indexed access."
          }
        ]
      },
      {
        name: "Data Wrangling",
        slug: "data-wrangling",
        sortOrder: 2,
        tasks: [
          {
            name: "Parse unstructured logs",
            slug: "parse-unstructured-logs",
            description: "Given a raw dump of mixed-format server logs (nginx, app, syslog), extract structured error events with timestamp, severity, and message.",
            prompt: "Extract all ERROR and WARN level events from raw logs and return them as a JSON array with timestamp, severity, service, and message keys.\n\nLogs:\n{{LOGS}}",
            expectedOutput: "Valid JSON array of structured log objects. Timestamps normalized to ISO-8601.",
            editorScore: 3,
            notes: "Reliable on documented formats (nginx combined, syslog RFC 5424, common app loggers). Recurring break points: multi-line stack traces split into multiple 'events'; syslog dates missing year silently dated to the current year; entries truncated by the context window dropped without warning.",
            rationale: "Documented formats parse cleanly — nginx combined, syslog RFC 5424, standard Python/Java/Node logger outputs all produce the right severity/timestamp/message tuple. The recurring break points are real-world messiness: multi-line stack traces are parsed as N separate events instead of one, syslog timestamps without a year get silently assigned to the current year (a real problem for log replay across boundaries), and once the input gets long, entries near the bottom can be dropped without the output flagging the truncation. For a one-shot triage of a clean log dump: good. For an ingestion pipeline: write actual parsers.",
            useCases: "One-shot log triage during an incident when you don't have time to write a parser; converting tail output into JSON for jq; teaching what log parsing logic looks like as a starting point for a real ingester."
          },
          {
            name: "Handle missing values in Pandas",
            slug: "handle-missing-pandas",
            description: "Write Pandas code to clean dataframes, handling missing data using median values, rolling averages, or specific default markers.",
            prompt: "Write a Python script using Pandas to identify columns with missing values in `df` and impute them: numeric columns with the column median, categorical columns with 'Unknown'.",
            expectedOutput: "Clean Python code using `df.fillna()` or `df.select_dtypes()` to split columns and apply imputation.",
            editorScore: 4,
            notes: "Idiomatic vectorized code (no `.apply` loops). Two silent gotchas worth knowing: median fill on `Int64` columns promotes them to `float64`; 'Unknown' fill on `object` dtype is applied indiscriminately to genuine free-text columns (comments, descriptions) where it makes no analytical sense.",
            rationale: "Idiomatic vectorized code lands first try — `select_dtypes(include='number')` and `select_dtypes(include='object')` to partition the columns, then column-wise `fillna(df[col].median())` and `fillna('Unknown')`. No row-by-row apply loops. The subtle issues are dtype and semantics: filling an `Int64` column with a median value that's a float silently promotes the column to `float64` (real headache downstream if a join key is involved), and treating all `object` columns as 'categorical' applies 'Unknown' to free-text columns like `description` or `comment` where it's analytically meaningless. The code works; whether it's the right transformation depends on context.",
            useCases: "Notebook first-pass cleaning; quick pre-training feature prep; converting raw CSV into a usable dataframe before deciding on a real imputation strategy."
          },
          {
            name: "Format messy CSV timestamps",
            slug: "format-messy-timestamps",
            description: "Write a script to parse irregular, string-based date formats in a CSV file and convert them all to a clean ISO-8601 standard.",
            prompt: "Write Python code that parses dates in varying formats ('MM/DD/YYYY', 'YYYY-MM-DD HH:MM:SS', 'DD-Mon-YY') and standardizes them to ISO-8601 UTC format.",
            expectedOutput: "Python script using `pd.to_datetime()` with `errors='coerce'` or `dateutil.parser` mapping dates safely.",
            editorScore: 4,
            notes: "`pd.to_datetime(..., errors='coerce', utc=True)` (with `format='mixed'` on pandas 2.0+) handles most variants and fails safely. Unsolved without explicit prompting: ambiguous DD/MM vs MM/DD strings are silently picked one way (US-style default) with no warning that the choice was made.",
            rationale: "Picks the right primary tool — `pd.to_datetime(..., errors='coerce', utc=True)` — and on pandas 2.0+ adds `format='mixed'` for the heterogeneous case. Handles timezone-naive vs aware correctly and returns a clean Series. The unsolved problem, which the output rarely flags: '01/02/2024' is parsed as January 2 by default (US-style) without any signal that an ambiguous string was disambiguated arbitrarily. If your data mixes locales (US sources + UK sources), the conversion is silently wrong for half the rows. You have to inspect a sample and pass `dayfirst=True` per source.",
            useCases: "ETL preprocessing where source locales are known and consistent; CSV-to-Parquet conversion; normalizing data from a single vendor — but verify the locale assumption on multi-source data."
          }
        ]
      }
    ]
  },
  {
    name: "Product Management",
    slug: "product-management",
    description: "Roadmaps, user stories, agile ceremonies, and project coordination.",
    categories: [
      {
        name: "Requirements Gathering",
        slug: "prd-drafting",
        sortOrder: 1,
        tasks: [
          {
            name: "Draft PRD for authentication",
            slug: "prd-authentication",
            description: "Write product requirements document for passwordless magic link login.",
            prompt: "Draft a PRD for implementing passwordless login via magic email links. Cover: User Stories, Security Considerations, Functional Requirements, Metrics, and Out-of-Scope items.",
            expectedOutput: "Detailed PRD in Markdown covering all specified categories with clear specifications for user flows.",
            editorScore: 4,
            notes: "Structure complete (user stories, functional reqs, security, metrics, out-of-scope) and the magic-link threat surface is well-covered (token expiry, replay, rate limits, HIBP). Generic on integration: nothing about your existing auth provider, downstream services keyed off session identity, or your actual thresholds.",
            rationale: "The skeleton — user stories in As-a/I-want/So-that form, functional requirements, success metrics, security considerations, out-of-scope — comes out polished and complete. Magic link is well-trodden territory in the training data, so the threat coverage (token expiry, replay prevention, session binding, rate limiting on the request endpoint, HIBP lookup on the email itself) all surfaces unprompted. What's missing is everything specific to your system: how it integrates with your existing identity provider, which downstream services key off session identity and need to be told about the new login event, your actual rate-limit thresholds, your token TTL based on customer support load. Reads as a competent first draft, not a final spec.",
            useCases: "Kicking off a feature spec; structuring a 'we need to do this' Slack thread into a Doc; baseline checklist your draft has to clear before review."
          },
          {
            name: "Create user story mapping",
            slug: "user-story-mapping",
            description: "Break down booking checkout flow into epics and sprint stories.",
            prompt: "Create a user story map for a travel checkout flow (booking hotel). Break it down into Epics (Selection, Cart, Payment, Confirmation) and list individual user stories with acceptance criteria.",
            expectedOutput: "Clean story list organized by epics, with stories in 'As a... I want... So that...' format with Given-When-Then criteria.",
            editorScore: 4,
            notes: "Format compliance perfect (As-a/I-want/So-that + Given-When-Then). Stories are textbook (`as a customer, I want to add a hotel to my cart`) — domain-specific edge cases (multi-room, group bookings, currency switch mid-flow, partial cancellation eligibility) need to be added by hand.",
            rationale: "Decomposition is clean and on-format — every story fits the As-a/I-want/So-that mould with sensible Given-When-Then criteria, and the four epics get a balanced number of stories. The stories themselves are textbook: 'as a customer, I want to add a hotel to my cart, so that I can purchase it' is technically correct and says nothing useful. None of the actual booking-flow complexity surfaces unprompted — multi-room bookings, group reservations, currency switches mid-flow, partial cancellation eligibility, payment hold vs capture timing, channel manager sync. The output makes a competent backlog skeleton; the actual product judgment about which edge cases to elevate is still your job.",
            useCases: "Backlog scaffolding for a new feature when you need format-clean stories fast; teaching new PMs the story-map structure; converting a whiteboard photo into Jira tickets."
          },
          {
            name: "Define metrics for user search",
            slug: "define-search-metrics",
            description: "Design KPIs and analytics events to measure search bar engagement.",
            prompt: "Define a measurement framework for a new e-commerce search bar. Specify: Core KPIs (conversion, click-through, zero-result rate) and telemetry events (search_triggered, item_clicked).",
            expectedOutput: "A list of 5 KPIs and a structured table of event names with schema fields (search_term, result_count).",
            editorScore: 4,
            notes: "KPI coverage is comprehensive (search-to-click, zero-result rate, refinement rate, conversion lift, time-to-click). Event schema is Segment/Mixpanel-clean. Missing layers: instrumentation channel guidance (client beacon vs. server log — matters for adblockers), separation of organic vs. promoted/sponsored results, and a guard metric for the latency the new search bar adds to first paint.",
            rationale: "The KPI list reads like a textbook product analytics chapter — search-to-click rate, zero-result rate, refinement rate, conversion lift, and a time-based engagement metric. Event schema is snake_case clean, with `search_term`, `result_count`, `result_position_clicked`, and ready to drop into Segment or Mixpanel. The framework misses three real-world layers: no instrumentation channel guidance (client-side beacons get adblocked, server logs need a different schema), no separation of organic vs. promoted/sponsored results (which have to be tracked as different conversion funnels), and no guard metric for the latency the new search bar adds to first paint. Solid starter; a senior PM still has to layer the missing pieces.",
            useCases: "Drafting an analytics spec to hand to engineering; reviewing whether your existing event schema has gaps; onboarding a new analyst to your measurement conventions."
          }
        ]
      },
      {
        name: "Agile Planning",
        slug: "agile-planning",
        sortOrder: 2,
        tasks: [
          {
            name: "Write sprint release notes",
            slug: "sprint-release-notes",
            description: "Summarize engineering commits into customer-facing release notes.",
            prompt: "Summarize the following developer commit messages into a polished, user-friendly Release Notes document. Highlight new features, bug fixes, and performance improvements.\n\nCommits:\n{{COMMITS}}",
            expectedOutput: "Clean Markdown release notes split into sections (What's New, Fixed, Improved) using clear, customer-centric language.",
            editorScore: 4,
            notes: "Translation from `fix(api): null pointer in /users` to 'Fixed an issue where some user-endpoint requests failed' is exactly the model's strength. Recurring failure: dev-only refactors and internal cleanups occasionally get promoted to customer-visible 'Improved' bullets because the conventional-commit prefix was `perf:` or `refactor:`.",
            rationale: "Translation from `fix(api): null pointer in /users when user_id missing` to customer-facing 'Fixed an issue where requests with missing user IDs failed on the user endpoint' is exactly the kind of tone-shift the model handles well. Conventional commit prefixes drive accurate categorization into What's New / Fixed / Improved. The recurring failure is over-promotion: refactors and internal cleanups that should never have reached the customer notes occasionally land in the public output because the commit said `perf:` even when the perf change was developer-only (CI speed, dev server start time). You still have to read the output and cut anything customers don't actually experience.",
            useCases: "First-pass release notes from a git log; changelog entries for an internal Slack announcement; turning a sprint demo into customer-facing copy."
          },
          {
            name: "Draft sprint retro guidelines",
            slug: "sprint-retro-guidelines",
            description: "Write template questions for retrospective focusing on velocity blockages.",
            prompt: "Write a template and facilitator guide for a sprint retrospective. Design it to address team conflict and velocity blockages. Provide exercises for action item generation.",
            expectedOutput: "A structured retro template (e.g. Start/Stop/Continue) along with instructions for the Scrum Master on resolving blocks.",
            editorScore: 3,
            notes: "Template structure is solid and reusable (Start/Stop/Continue with sensible facilitation cues). The specific ask — 'address team conflict and velocity blockages' — yields generic psychological-safety advice ('use I-statements, create a safe space') rather than concrete techniques like 5-whys with worked examples, Conflict Mode Inventory framing, or sample facilitator scripts.",
            rationale: "The retro template (Start/Stop/Continue or Mad/Sad/Glad with a facilitator script) is solid and immediately reusable. Where it underdelivers is the specific request: 'address team conflict and velocity blockages' yields psychological-safety platitudes ('create a safe space,' 'use I-statements') rather than concrete techniques. No 5-whys exercise with a worked example, no Conflict Mode Inventory framing, no actual scripts a Scrum Master could read out when the tension shows up. For a new Scrum Master who needs a structure to follow: useful. For a team that's actually deadlocked: it doesn't go deep enough on the hard part of the question.",
            useCases: "First retro for a new Scrum Master who needs a structure; refreshing a stale format; pre-meeting checklist."
          },
          {
            name: "Triage backlog bug tickets",
            slug: "backlog-bug-triage",
            description: "Define priority matrix based on user impact and tech feasibility.",
            prompt: "Draft a prioritization matrix to triage 5 incoming bugs. Explain the criteria for assigning Critical, High, Medium, Low severity based on user volume and blockages.",
            expectedOutput: "A clean prioritization rubric with definitions for each severity level and example scenarios.",
            editorScore: 3,
            notes: "Four-tier rubric (Critical/High/Medium/Low) with sensible-looking criteria. Two structural issues: (1) bakes in B2C definitions of impact ('affects 10%+ of users = High'), which breaks for B2B SaaS where one enterprise customer can dwarf the SMB tail; (2) conflates severity (technical urgency) with priority (business urgency) — they're different axes.",
            rationale: "Produces a standard four-tier severity rubric with criteria that look reasonable on the page — Critical for total blockage of a critical flow, High for impaired flow, Medium and Low for cosmetic and edge-case issues. Two structural problems: the model bakes in a B2C-shaped definition of impact ('affects 10%+ of users = High') that doesn't survive contact with B2B SaaS, where a single enterprise customer can be half your revenue and 'affects 1 user' might be Critical. And it conflates 'severity' (how broken is it) with 'priority' (how soon do we fix it) — a low-severity bug for a Fortune 500 customer is high-priority for business reasons orthogonal to severity. Useful skeleton, but you have to layer your customer-segment economics on top.",
            useCases: "First triage policy doc for a new team; aligning support and engineering on shared definitions; bug-bash prep where everyone needs the same vocabulary."
          }
        ]
      }
    ]
  },
  {
    name: "Marketing & Copywriting",
    slug: "marketing-copywriting",
    description: "SEO, advertising copy, brand positioning, and user acquisition strategies.",
    categories: [
      {
        name: "SEO Optimization",
        slug: "seo",
        sortOrder: 1,
        tasks: [
          {
            name: "Generate blog post outline",
            slug: "blog-post-outline",
            description: "Create SEO-focused outline for 'Next.js 15 Server Components' targeting dev keywords.",
            prompt: "Create an SEO-optimized blog post outline for the topic 'Next.js 15 Server Components'. Target keywords: 'Next.js 15, Server Components, React 19, dev tutorial'. Include meta tags and header structure (H1-H3).",
            expectedOutput: "An outline with suggested headings containing target keywords, meta title, meta description, and subtopics for each section.",
            editorScore: 3,
            notes: "Structure correct (H1 with primary keyword, logical H2 progression, meta title/description within character limits, keyword density natural). Strategic gap: subtopic suggestions ('What are Server Components?', 'vs Client Components') are saturated commodity territory — every existing post covers them. The model has no SERP awareness, so it points you at the same things competitors have already written.",
            rationale: "Format is on-spec: H1 with the primary keyword, H2s in logical reading order, meta title and description within character limits, keyword density natural rather than stuffed. The strategic gap is that every subtopic suggested — 'What are Server Components?', 'vs Client Components', 'Data Fetching Patterns', 'Migration Guide' — is exactly what every existing post on this topic already covers. Without actual SERP analysis or topic-cluster insight, the outline points you at saturated territory and gives you nothing competitive to differentiate. Use it as a structure prompt; do your own SERP scan to find the angles that aren't already saturated.",
            useCases: "Brief skeleton for a freelance writer who'll handle the actual research; teaching outline structure to a junior content marketer; format-compliance check on a draft someone else wrote."
          },
          {
            name: "Draft meta titles and descriptions",
            slug: "meta-titles-descriptions",
            description: "Write 5 high-converting meta options under 160 characters.",
            prompt: "Write 5 meta title and description combinations for a product page selling 'Eco-friendly organic coffee beans'. Keep titles under 60 chars and descriptions under 160 chars.",
            expectedOutput: "A list of 5 options with character counts shown. Titles and descriptions should include CTAs and keywords.",
            editorScore: 4,
            notes: "Character compliance is exact (counts shown next to each variant, every option within 60/160 limits). CTAs and keywords land. The genuine variety is shallow — even when asked for '5 different angles,' the variants tend to swap CTA verbs ('Shop' / 'Discover' / 'Buy') while the underlying value prop stays identical. Press for distinct angles (price, ethics, ritual, gift) explicitly if you want range.",
            rationale: "Character compliance is exact — counts shown next to each variant, every option within 60/160 limits without contortions to fit. CTAs and keywords surface in each variant. The weakness is variety: even when asked for '5 different angles,' the output tends to swap CTA verbs ('Shop sustainable...' / 'Discover ethical...' / 'Buy organic...') while the underlying value prop stays identical. To get genuinely distinct angles (price, ethics, ritual, gift, origin story), you have to specify those angles in the prompt.",
            useCases: "Product page SEO writeup; A/B test variant pool; meta tag audit pass on an existing catalog."
          },
          {
            name: "Write schema markup JSON-LD",
            slug: "schema-markup-json",
            description: "Generate valid FAQ schema JSON-LD markup for a product page.",
            prompt: "Write valid JSON-LD schema markup for a product FAQ containing 3 questions: shipping times, return policy, and organic certification.",
            expectedOutput: "Valid JSON-LD schema within script tag with '@context': 'https://schema.org' and '@type': 'FAQPage' mapping the questions and answers.",
            editorScore: 5,
            notes: "FAQ schema is essentially memorized — `@context`, `@type: FAQPage`, `mainEntity` array with `Question`/`acceptedAnswer`/`Answer.text` all correct first try. Richer schemas (Product with `offers` + `aggregateRating`, Recipe with `nutrition`, Article with `Person` author) are more prone to missing a required field — validate those with Google's Rich Results Test before shipping.",
            rationale: "FAQ schema is well-trodden territory: `@context: schema.org`, `@type: FAQPage`, `mainEntity` array of `Question` objects with `name` and `acceptedAnswer` (`@type: Answer`, `text:`) — all correct first try, JSON validity high, ready to drop into a `<script type=\"application/ld+json\">` tag. Where it gets less reliable is the richer types: Product schema with `offers` and `aggregateRating`, Article with structured `Person` author, Recipe with `nutrition` and `recipeInstructions` — more nesting, more required fields, more chances to drop one. For FAQ specifically: production-ready.",
            useCases: "Adding FAQ rich snippets to a help page; bootstrapping schema across a product catalog; teaching the JSON-LD vs microdata distinction."
          }
        ]
      },
      {
        name: "Ad Copywriting",
        slug: "ad-copy",
        sortOrder: 2,
        tasks: [
          {
            name: "Write Google Search Ad copy",
            slug: "google-search-ad",
            description: "Generate 3 headlines and 2 descriptions matching character limits.",
            prompt: "Write copy for a Google Search Ad promoting a 'Fast Coding Assistant'. Provide: 3 Headlines (max 30 chars each) and 2 Descriptions (max 90 chars each). Show character count for each.",
            expectedOutput: "Ad copy with strict character counts shown, containing search keywords and clear call-to-actions.",
            editorScore: 4,
            notes: "Character compliance perfect, counts shown next to every variant, high-intent keywords surface naturally. Blind to Quality Score levers — landing page match, expected CTR vs historical baseline, ad-group themability — so the copy reads well in isolation but isn't optimized to your ad ecosystem.",
            rationale: "Exact character compliance with counts shown — the constraint-following is essentially perfect, and the copy never has to be trimmed by hand. CTAs and high-intent search keywords surface naturally in every variant. The blind spot is Quality Score: the model can't see your landing page H1 to confirm match, doesn't know your historical CTR baseline, and can't evaluate ad-group themability. For raw copy generation: production-ready; for ranking-optimized copy that actually wins the auction at a lower CPC, you still need the landing-page-fit and ad-group-coherence pass.",
            useCases: "Generating ad variants for a new campaign; A/B test pool seeding; refreshing fatigued ad copy when you remember the constraints but not the wording."
          },
          {
            name: "Draft Facebook Ad hook",
            slug: "facebook-ad-hook",
            description: "Write 3 scroll-stopping copy hooks for B2B SaaS target audience.",
            prompt: "Write 3 different angles for a Facebook ad hook targeting Engineering Managers. SaaS benefit: 'Reduce merge conflict resolution time by 80%'. Angles: Direct, Story-based, Curiosity-based.",
            expectedOutput: "3 hooks of 2-3 sentences each, formatted to attract attention immediately on feed scrolling.",
            editorScore: 3,
            notes: "Direct angle is keeper-quality (skeptical, time-poor register that matches engineering managers). Story-based reads as fabricated 'last week our team...' anecdote that rings as LLM-generated to anyone who's read more than three of these. Curiosity-based often drifts into clickbait ('The mistake 90% of dev teams make').",
            rationale: "Tone register matches engineering managers well — direct, skeptical, time-poor, no fluffy promises. The direct angle is production-ready and you could ship it. The story-based angle reads as fabricated: generic 'last week, our team' anecdotes with details that ring as LLM-generated to anyone who's read more than three of these. Curiosity hooks can swing into clickbait territory ('The mistake 90% of dev teams make about merge conflicts'). The direct version is the keeper; rewrite the others by hand or feed real customer quotes.",
            useCases: "Variant generation for paid social tests where you'll keep the direct angle and discard the others; brainstorm starter for a copywriter; benchmark for evaluating a vendor's ad work."
          },
          {
            name: "Write sponsor newsletter copy",
            slug: "sponsor-newsletter-copy",
            description: "Write short, engaging 150-word newsletter sponsor placement text.",
            prompt: "Write a 150-word sponsored email newsletter section for a developer newsletter. Product: 'Secure DB Client'. Tone: Dev-focused, informal, value-driven. Highlight free tier.",
            expectedOutput: "A 150-word text including subject line placeholder, benefit bullets, and call-to-action link.",
            editorScore: 4,
            notes: "Hits the dev-newsletter register (Bytes/TLDR — informal, value-first, no corporate-speak) with word-count compliance. Defaults to the now-saturated 'stop doing X' opener and a templated free-tier paragraph — vary across placements to avoid pattern fatigue.",
            rationale: "Hits the dev-newsletter tone (Bytes/TLDR/Refind register — informal, value-first, no corporate fluff) and word-count compliance is exact. The trap is novelty: the model defaults to the now-saturated 'stop doing X with Y' opener and the 'free tier' paragraph is structurally identical across every sponsor placement you'd produce. For one sponsorship: production-ready. For a portfolio of placements in the same publication: readers will notice the pattern by placement three. Vary the opener manually.",
            useCases: "Drafting a placement on deadline when you have the product positioning but not the words; brainstorming subject lines; learning the dev-newsletter register before writing your own."
          }
        ]
      }
    ]
  },
  {
    name: "Legal & Compliance",
    slug: "legal-compliance",
    description: "Legal drafting, document review, risk analysis, and corporate compliance.",
    categories: [
      {
        name: "Contract Analysis",
        slug: "contracts",
        sortOrder: 1,
        tasks: [
          {
            name: "Extract contract dates",
            slug: "extract-contract-dates",
            description: "Extract effective dates, notice period, renewal window from agreement.",
            prompt: "Extract all legally operative dates from the following contract. Return a JSON object with: effective_date, expiry_date, notice_period_days, auto_renewal.\n\nContract:\n{{CONTRACT}}",
            expectedOutput: "Valid JSON object mapping all dates. Dates converted to YYYY-MM-DD. Notice periods mapped as integers.",
            editorScore: 3,
            notes: "On a standard SaaS MSA with explicit 'effective as of' / 'expires on' clauses: clean JSON, ISO-8601 dates, integer notice periods, near-deterministic. Three real-world failures: (1) 'date of last signature' references that require finding and parsing the signature block, (2) conditional notice periods ('30 days, or 90 if regulated') flattened to a single integer, (3) `auto_renewal: true` without surfacing the carve-outs ('unless terminated 60 days prior').",
            rationale: "On a standard SaaS MSA with explicit 'effective as of January 1, 2025' and 'expires on...' clauses, extraction is essentially deterministic — JSON valid, dates ISO-normalized, integer notice period as requested. Three failure modes show up on messier contracts: (1) 'date of last signature' references that require the model to find and parse the actual signature block, (2) conditional notice periods ('30 days, or 90 days if the customer is in a regulated industry') flattened to a single integer without surfacing the conditional, (3) `auto_renewal: true` reported flatly without the carve-outs ('unless terminated by either party at least 60 days prior'). For straight extraction on well-formed contracts: reliable. For risk-aware extraction: needs a second pass.",
            useCases: "Bulk-tagging contract dates into a CLM tool when the contracts are well-formed; populating renewal-reminder dashboards; first-pass triage for legal ops before a human reviews the messy ones."
          },
          {
            name: "Identify liability risks in MSA",
            slug: "identify-liability-risks",
            description: "Find standard indemnity/liability clauses that disadvantage a vendor in a Master Services Agreement.",
            prompt: "Review the attached Master Services Agreement. Identify clauses relating to Limitation of Liability, Indemnity, and Intellectual Property that represent high risk for a software service vendor.",
            expectedOutput: "A risk report detailing vulnerable clauses, risk level (Low/Med/High), and recommended negotiation language.",
            editorScore: 3,
            notes: "Reliable pattern recognition on named risky clauses — unilateral indemnity, uncapped IP, exclusions from the cap (gross negligence, willful misconduct), data breach carve-outs. Cannot do commercial judgment: a 2x-fees cap is risky in a $50K deal and standard in a $5M deal, and the model has no signal about which you're in. Frequently misses cross-section reconciliation — an indemnity that looks unilateral is sometimes balanced by a mutual indemnity elsewhere in the document.",
            rationale: "Catches the named risk patterns reliably — unilateral indemnity, uncapped liability for IP infringement, exclusions from the liability cap (gross negligence, willful misconduct, data breach), one-way warranty disclaimers. What it can't do is the actual commercial judgment: a 2x-annual-fees liability cap is risky in a $50K deal and standard in a $5M deal, and the model doesn't know which deal you're in. It also frequently misses cross-section reconciliation — an indemnity in Section 8 that looks unilateral is sometimes balanced by a mutual indemnity buried in Section 11, and the report flags only the first one. Use it as a pattern-spotter; an attorney still owns the commercial-judgment call.",
            useCases: "First-pass redline for legal ops before sending to outside counsel; commercial team self-service screening on inbound paper; checklist for contract review training."
          },
          {
            name: "Draft NDA agreement clause",
            slug: "draft-nda-clause",
            description: "Write mutual confidentiality and non-disclosure clause under NY law.",
            prompt: "Draft a mutual confidentiality clause for a business agreement. Ensure it covers definition of Confidential Information, standard exceptions (public info, third party), and survival duration (5 years) under New York law.",
            expectedOutput: "A formal mutual NDA clause in legal terminology with clear exceptions and duration provisions.",
            editorScore: 3,
            notes: "Reads like a competent transactional draft — definition, standard exceptions (public, independently developed, lawful third-party), 5-year survival, NY governing law. Two material omissions: (1) the 5-year survival applied to *all* Confidential Information sweeps trade secrets in, which under most state law should be perpetual; (2) no remedies/injunctive relief language, which materially weakens enforcement.",
            rationale: "Reads like a competent transactional draft — definition of Confidential Information, standard exceptions (already public, independently developed, lawfully obtained from a third party with no duty of confidentiality), 5-year survival, governing law clause. Two material omissions show up consistently: applying the 5-year survival to all Confidential Information sweeps trade secrets into the same bucket, which under most state law is wrong (trade secrets typically get perpetual protection so long as they remain secret); and there's no remedies clause — an NDA without injunctive relief language is materially harder to enforce when the breach happens. Solid base; add the trade-secret carve-out and the injunctive relief language.",
            useCases: "Drafting a baseline NDA template you'll customize; clause for a one-off meeting where stakes are low; teaching contract structure to a non-lawyer."
          }
        ]
      },
      {
        name: "Compliance Audits",
        slug: "compliance",
        sortOrder: 2,
        tasks: [
          {
            name: "Check GDPR data retention rules",
            slug: "gdpr-retention-check",
            description: "Audit privacy policy or database schema for GDPR data minimization compliance.",
            prompt: "Audit this database schema and list any potential GDPR compliance violations. Specifically check for: storage of PII, retention policies, and user deletion readiness.",
            expectedOutput: "A structured list of violations (e.g. storing plain-text passwords, phone numbers with no expiry) and remediation recommendations.",
            editorScore: 3,
            notes: "Reliable at schema-layer findings — PII columns without retention metadata, no hard-delete pathway, missing consent tracking, no separation of profile and auth tables. Two conceptual gaps: (1) lumps security findings (plaintext passwords) into the GDPR bucket when they're really a different framework; (2) stops at the schema and doesn't ask about lawful basis for processing, Article 30 records, DPIA triggers, or DSAR fulfillment paths — all equally GDPR.",
            rationale: "Catches the architectural smells reliably — PII columns without retention metadata, no hard-delete pathway for the right-to-erasure, missing consent tracking on data collection, no separation between profile data and authentication data. The conceptual blur: it lumps security findings (passwords in plaintext) into the GDPR bucket when they're really a separate framework (that's a SOC 2 / general infosec finding). It also stops at the schema layer — doesn't ask about lawful basis for processing, doesn't mention Article 30 Records of Processing Activities, doesn't flag DPIA triggers for high-risk processing, doesn't ask how your DSAR fulfillment pathway works in practice. Schema-layer audit: solid. Compliance program audit: starting point only.",
            useCases: "Engineering-led GDPR readiness pre-check before a privacy review; spotting obvious schema issues that would embarrass you in front of counsel; teaching engineers what privacy counsel will ask."
          },
          {
            name: "Draft terms of service section",
            slug: "draft-terms-section",
            description: "Write terms of service clause covering user generated content.",
            prompt: "Draft a Terms of Service clause for a SaaS app. The clause must cover: User Generated Content (UGC), user licensing grant to the app, prohibited content, and indemnity for copyright violation.",
            expectedOutput: "A formal terms section detailing UGC ownership, prohibited conduct list, and copyright violation terms.",
            editorScore: 3,
            notes: "Skeleton complete (UGC ownership retained by user, license grant to platform, prohibited content list, copyright indemnity). License grant defaults to maximally broad ('perpetual, irrevocable, worldwide, sublicensable, royalty-free') even when narrower would suffice — defensible negotiation point for power users. No moral-rights waiver or DMCA designated agent reference.",
            rationale: "UGC, license grant, prohibited content, indemnity — all the named sections appear and read professional. The license grant defaults to maximally broad ('perpetual, irrevocable, worldwide, sublicensable, royalty-free' for any UGC), which is more aggressive than most modern consumer apps actually need and is a defensible negotiation point for power users or creators. No moral rights waiver (matters in jurisdictions like France and Germany where moral rights aren't fully waivable), no DMCA designated agent reference (required for safe harbor in the US). Solid skeleton; narrow the license grant scope and add the DMCA designation.",
            useCases: "ToS draft for a new SaaS launch you'll then send to counsel; reviewing your existing ToS against a checklist; baseline before sending to outside counsel for the real polish."
          },
          {
            name: "Verify trademark filing requirements",
            slug: "verify-trademark-filing",
            description: "Outline steps and checklist for filing a US trademark application.",
            prompt: "Provide a detailed step-by-step checklist for filing a trademark application with the USPTO. Include: requirements, classifications, and search guidelines.",
            expectedOutput: "An actionable USPTO filing checklist detailing trademark search, classes selection, application submission steps.",
            editorScore: 3,
            notes: "Process steps accurate (TESS preliminary search, 1(a) use-in-commerce vs 1(b) intent-to-use basis, international class selection, TEAS Plus vs Standard, office action windows, declaration of use). Doesn't flag the predictable failure modes most first-time applicants hit: specimens rejected as 'ornamental,' descriptiveness refusals, conflicting marks TESS missed. No cost guidance or Madrid Protocol overview.",
            rationale: "USPTO process is heavily documented in the training set and the checklist accurately reflects it — TESS preliminary search, 1(a) vs 1(b) basis decision, international class selection, TEAS Plus vs Standard, office action monitoring, declaration of use windows. What's missing is the failure-mode knowledge: most first-time applicants get hit with a specimen-of-use rejection (the photo of merch they submitted is 'ornamental,' not source-identifying) or a descriptiveness refusal, and a step-by-step guide that doesn't flag these is leaving applicants to learn the hard way. Also no cost guidance (filing fees per class, attorney fees if you hire counsel) and no Madrid Protocol overview for international strategy. Workflow accurate, gotchas missing.",
            useCases: "Founder DIY trademark research before deciding whether to hire counsel; preparing to brief outside counsel; brand-protection checklist for an early-stage company."
          }
        ]
      }
    ]
  }
];

async function main() {
  console.log("Cleaning database...");
  await prisma.vote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.aiModel.deleteMany();

  console.log("Seeding models...");
  const models = [
    { name: "GPT-4o", slug: "gpt-4o", provider: "OpenAI" },
    { name: "Claude 3.5 Sonnet", slug: "claude-3-5-sonnet", provider: "Anthropic" },
    { name: "Gemini 1.5 Pro", slug: "gemini-1-5-pro", provider: "Google" },
    { name: "Llama 3.1 405B", slug: "llama-3-1-405b", provider: "Meta" }
  ];

  for (const model of models) {
    await prisma.aiModel.create({ data: model });
  }

  console.log(`Seeding ${SEED_DATA.length} domains...`);
  let totalTasks = 0;

  for (const domainData of SEED_DATA) {
    const domain = await prisma.domain.create({
      data: {
        name: domainData.name,
        slug: domainData.slug,
        description: domainData.description,
      }
    });

    console.log(`Created domain: ${domain.name}. Seeding categories...`);

    for (let i = 0; i < domainData.categories.length; i++) {
      const categoryData = domainData.categories[i];

      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          domainId: domain.id,
          sortOrder: i + 1
        }
      });

      console.log(`  Seeding ${categoryData.tasks.length} tasks for category: ${category.name}...`);

      for (const taskData of categoryData.tasks) {
        await prisma.task.create({
          data: {
            name: taskData.name,
            slug: taskData.slug,
            categoryId: category.id,
            description: taskData.description,
            prompt: taskData.prompt,
            expectedOutput: taskData.expectedOutput,
            editorScore: taskData.editorScore,
            notes: taskData.notes,
            rationale: taskData.rationale,
            useCases: taskData.useCases,
            publishedAt: new Date(),
          }
        });
        totalTasks++;
      }
    }
  }

  console.log(`Seed complete successfully! Created ${SEED_DATA.length} domains, ${SEED_DATA.length * 2} categories, and ${totalTasks} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
