import { PrismaClient } from "../generated/client"

const prisma = new PrismaClient()

const SEED_DATA = [
  {
    name: "Software Engineering",
    slug: "software-engineering",
    description: "AI capability across the software engineering craft — code review, DevOps, testing, system design, debugging, refactoring, performance, and security.",
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
            rationale: "**What works.** First-order interpolation is pattern-matched across any mainstream language — `f\"SELECT ... {x}\"` followed by `cursor.execute(query)` gets flagged immediately, with the corrected parameterized version produced in the same response.\n\n**Where it breaks.** Second-order injection — input sanitized on write, concatenated on read — slips through. Same for ORM raw-query escape hatches like `User.objects.raw(f\"...\")` that read like safe ORM calls. The pattern matcher doesn't trace multi-step data flows.\n\n**Bottom line.** Production-ready for first-pass PR review. Use it as one signal among several when auditing systems with known complex data flows.",
            useCases: "- Pre-commit Semgrep-style sanity check, catching the obvious bugs before they reach a PR\n- First pass on a PR review bot — flags the easy stuff so human reviewers focus on subtler bugs\n- Teaching juniors what `cursor.execute(f\"...\")` looks like and why parameterized queries are the only safe pattern"
          },
          {
            name: "Review for race conditions",
            slug: "review-for-race-conditions",
            description: "Analyze concurrent or async code and identify potential race conditions, explaining when the hazard occurs and how to fix it with proper synchronization.",
            prompt: "Review the following concurrent code for race conditions and thread-safety issues.\n\nFor each issue:\n1. Identify the specific lines involved\n2. Describe the exact scenario in which the race occurs\n3. Suggest a fix (mutex, atomic, channel, etc.)\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of all shared-state hazards, timing-dependent bugs, and unsafe concurrent access patterns with correct synchronization fixes.",
            editorScore: 2,
            notes: "Reliably flags shared mutable state — a goroutine writing to a map, two threads incrementing a counter. Misses TOCTOU patterns, async/await interleaving at await boundaries, transaction isolation-level bugs, and distributed locking issues.",
            rationale: "**What works.** The easy cases — goroutine writing to a shared map, two threads reading-then-writing a counter, missing mutex on a struct field. Output identifies the racing lines and proposes a sensible synchronization primitive.\n\n**Where it breaks.** TOCTOU patterns (check-then-act on the filesystem), async/await interleaving where state changes between awaits, transaction isolation-level bugs, distributed locking issues. Without an actual model of concurrent execution, the analysis is pattern-matching on 'this looks like a race' rather than tracing real interleavings.\n\n**Bottom line.** Useful as a smell-check on PR diffs touching concurrency. Not safe as a sole guardrail for concurrency-critical code paths.",
            useCases: "- First-pass smell check on PR diffs that touch concurrency\n- Teaching juniors what a race condition looks like in code\n- Generating a list of suspects to verify with a real concurrency tool (race detector, ThreadSanitizer)"
          },
          {
            name: "Check for memory leaks",
            slug: "check-for-memory-leaks",
            description: "Review C++ or Go allocation code and detect missing frees, unclosed file descriptors, or dangling references.",
            prompt: "Analyze this code for potential memory leaks, unclosed streams/handles, or resource leaks. Recommend proper cleanup blocks.\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "Detailed detection of unreleased resources (e.g. unclosed file descriptors, missing delete commands) with equivalent try-finally/defer code fixes.",
            editorScore: 3,
            notes: "Reliable on syntactic patterns (missing defer/close/free, open() without context manager). Misses heap lifetime issues — circular references in refcounted languages, retained closures capturing large state, custom arena allocator lifetime bugs.",
            rationale: "**What works.** Syntactic resource leaks land — `open()` without `with`, `fopen` without `fclose`, missing `defer` after `os.Open`, manual `new` without matching `delete`. The fix uses the right idiom for the language.\n\n**Where it breaks.** Heap lifetime analysis. A circular reference between two retained objects in a refcounted language reads as 'fine' because every line looks correct in isolation. Same for closures that accidentally retain a huge buffer, or custom arena allocators where lifetime is governed by a higher-level structure the model can't see.\n\n**Bottom line.** A static eyeball pass. No substitute for a profiler when the leak isn't obvious from the source.",
            useCases: "- Catching the obvious 'forgot to close the file' bug in a PR\n- Teaching the with/defer/RAII pattern by example\n- First-pass review of resource-handling code before manual deep-dive"
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
            notes: "YAML structure, PromQL syntax, severity labels, and runbook_url annotation all correct first try. Thresholds (>0.95 error rate, >500ms p99) and `for:` durations (5m, 10m) are textbook defaults with no relationship to your service's actual SLO.",
            rationale: "**What works.** The boilerplate is essentially perfect — `groups`, `rules`, `expr`, `for`, `labels.severity`, `annotations.summary/description/runbook_url`. PromQL syntax (rate(), histogram_quantile(), by/without clauses) compiles first try.\n\n**Where it breaks.** Everything that requires knowing your service. Thresholds default to textbook values (`> 0.95` error rate, `> 500ms` p99, `for: 5m`), which have no relationship to your service's baseline behavior.\n\n**Bottom line.** A deployable-shaped skeleton, not a deployable rule. Treat the numbers as TODOs.",
            useCases: "- Bootstrapping a new alert group when you remember the structure but not the YAML keys\n- Teaching PromQL + rule syntax to someone new to the stack\n- Converting a 'we need an alert for X' Slack thread into a starter PR"
          },
          {
            name: "GitHub Actions workflow for monorepo",
            slug: "github-actions-monorepo",
            description: "Create an optimized GitHub Actions YAML pipeline that runs build, lint, and test tasks for changed packages inside a Turborepo.",
            prompt: "Write a GitHub Actions YAML workflow that builds and tests a Turborepo monorepo. Optimize it by:\n- Caching pnpm store\n- Caching Turborepo builds\n- Only running tests on modified packages using turbo filter.",
            expectedOutput: "Valid YAML containing caching action hooks for pnpm and turbo, using turbo run build --filter=[changed] to speed up execution.",
            editorScore: 4,
            notes: "Action structure and cache configuration land cleanly. Two traps: frequently pins outdated action versions (`actions/cache@v3`, `pnpm/action-setup@v2`) after newer majors ship; and the 'filter changed packages' syntax is often written as `--filter=[changed]` which isn't real turbo syntax.",
            rationale: "**What works.** Cache configuration and the pnpm + turbo orchestration come out right — `actions/setup-node` with `cache: 'pnpm'`, the turbo remote-cache token block, the install step.\n\n**Where it breaks.** Action version pinning lags reality — the model frequently outputs `actions/cache@v3` or `pnpm/action-setup@v2` because the training set has more historical examples than current ones. The turbo `--filter=[changed]` syntax is also bogus; the actual form is git-ref based (`--filter=...[origin/main]`).\n\n**Bottom line.** Structural template, not a deployable workflow. Validate every pinned version and filter expression against your repo's actual versions.",
            useCases: "- Bootstrapping CI on a new monorepo\n- Migrating from npm/yarn to pnpm + turbo\n- Producing a starter workflow you then update with current action versions"
          },
          {
            name: "Docker multi-stage build",
            slug: "docker-multi-stage-build",
            description: "Create an optimized, secure Dockerfile for a Next.js application using multi-stage builds to minimize output image size.",
            prompt: "Create a multi-stage Dockerfile for a Next.js application. Ensure it runs as a non-root user, optimizes node_modules caching, and outputs a minimal image.",
            expectedOutput: "A Dockerfile with separate builder and runner stages, setting PORT, NODE_ENV, copying runner outputs, and switching USER to node.",
            editorScore: 4,
            notes: "Multi-stage structure, non-root user, NODE_ENV, EXPOSE all clean. Next.js-specific gotcha: the Dockerfile assumes `output: 'standalone'` is set in `next.config.js` but rarely calls it out, so the `COPY .next/standalone ./` step silently fails on a config that hasn't enabled it.",
            rationale: "**What works.** Multi-stage skeleton lands clean — separate `deps`, `builder`, `runner` stages, non-root `node` user, `NODE_ENV=production`, `EXPOSE 3000`, `--chown=node:node` on copies.\n\n**Where it breaks.** The Next.js-specific standalone-output assumption. The template usually copies from `.next/standalone/` and `.next/static/`, but that directory only exists if `output: 'standalone'` is set in `next.config.js`. The Dockerfile rarely flags this prerequisite, so you build the image, run it, and get a confusing 'file not found' from the entrypoint.\n\n**Bottom line.** Production-ready once you confirm `output: 'standalone'` is set.",
            useCases: "- Containerizing a Next.js service for the first time\n- Producing a small image for a Vercel-alternative deployment\n- Learning the multi-stage pattern from a working template"
          }
        ]
      },
      {
        name: "Testing & QA",
        slug: "testing-qa",
        sortOrder: 3,
        tasks: [
          {
            name: "Write unit tests for a function",
            slug: "write-unit-tests-function",
            description: "Given a function signature and body, generate Jest/Vitest unit tests covering happy path, edge cases, and error conditions.",
            prompt: "Write comprehensive unit tests in Jest/Vitest for the following function. Cover happy path, edge cases, and error conditions. Use `describe`/`it` blocks and group related assertions.\n\n```\n{{CODE}}\n```",
            expectedOutput: "A test file with `describe` blocks per function, `it` blocks per scenario, including null/undefined inputs, boundary values, type mismatches, and at least one error-throwing case.",
            editorScore: 4,
            notes: "Generates valid Jest/Vitest tests with describe/it structure first try. Covers null/undefined/empty inputs and boundary values reliably. Misses business-domain edge cases — gets standard zero/negative coverage but not 'what if customer is both employee and student?'. Mocks often test the mock itself.",
            rationale: "**What works.** Test scaffold structure (`describe` per function, `it` per scenario, `expect().toBe(...)`) lands first try. Generic edge cases — null, undefined, empty string, zero, negative, NaN — get systematic coverage. Type-related failure cases get caught.\n\n**Where it breaks.** Domain-specific edge cases require business context the model doesn't have. A `calculateDiscount(price, customerType, season)` function gets thorough null/zero/negative coverage but won't ask 'what if the customer is both an employee and a student?'. Mock setup is also a recurring weakness — over-mocked tests end up exercising the mock implementation rather than the function under test.\n\n**Bottom line.** Good for the skeleton plus happy-path plus obvious edges. A human still needs to add domain-specific cases and prune overconfident mocks.",
            useCases: "- Bootstrapping test files for new code when you want coverage fast\n- Establishing a consistent test structure across a team\n- Filling in coverage for legacy code that has none"
          },
          {
            name: "Generate property-based tests",
            slug: "property-based-tests",
            description: "Write property-based tests (Hypothesis, fast-check, jqwik) for a function, identifying meaningful invariants beyond type checks.",
            prompt: "Write property-based tests using {{LIBRARY}} (Hypothesis, fast-check, jqwik, etc.) for the function below. Identify at least 3 non-trivial invariants the function should preserve.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Property tests using `@given` (Hypothesis) or `fc.property` (fast-check) with strategy/arbitrary generators. Invariants must be substantive — testing relationships and conservation, not just types or non-nullness.",
            editorScore: 3,
            notes: "Library syntax (Hypothesis `@given`, fast-check `fc.property`, jqwik `@Property`) is correct. Invariants tend toward trivial ('output is non-null') rather than strong ('output is a permutation of input AND is sorted'). Stateful systems and time-dependent properties produce confused or generic property definitions.",
            rationale: "**What works.** Library syntax is well-covered — Hypothesis `@given(st.lists(st.integers()))`, fast-check `fc.property(fc.array(fc.integer()), ...)`, jqwik `@Property` decorators. Generator/arbitrary mappings for primitive types are correct.\n\n**Where it breaks.** The hard part of property-based testing is identifying *strong* invariants, not writing the syntax. The model defaults to weak invariants ('result is non-null', 'result has type List') rather than meaningful ones ('result is a permutation of input AND result is sorted'). Stateful systems and time-dependent properties trip it up entirely — it falls back to unit-test-style assertions.\n\n**Bottom line.** Useful for syntax scaffolding when you already know what invariants matter. Don't rely on it to find the invariants — that's the actual hard part.",
            useCases: "- Bootstrapping a property-test file when you know the invariants but not the library syntax\n- Teaching the property-based testing structure to someone new\n- Reminding yourself of generator combinators across languages"
          },
          {
            name: "Convert imperative test to BDD style",
            slug: "convert-test-bdd",
            description: "Translate Jest/Pytest assertion-style tests into behavior-driven (RSpec, Cucumber, Chai should-style) format.",
            prompt: "Convert the following test from {{SOURCE_FRAMEWORK}} to {{TARGET_FRAMEWORK}} in BDD style. Preserve test coverage; use behavior-describing `it`/`describe` strings rather than restating assertions.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Translated tests using the target framework's idiomatic syntax. Test descriptions describe behavior (\"it sums two integers\"), not assertion mechanics (\"it returns 5 when input is 2 and 3\").",
            editorScore: 4,
            notes: "Cross-framework syntactic translation is highly deterministic. Generated `it` descriptions occasionally read as restated assertions ('it returns 5 when input is 2 + 3') rather than behavior descriptions ('it adds two integers').",
            rationale: "**What works.** Syntactic translation — Jest's `expect().toBe()` to Chai's `should()` to Pytest's `assert` to RSpec's `expect(...).to eq` — is highly deterministic. Structure (describe/it, context blocks) maps cleanly.\n\n**Where it breaks.** The semantic layer. Turning `expect(add(2,3)).toBe(5)` into a behavior description often produces literal restatements ('it returns 5 when input is 2 and 3') rather than intent ('it sums two integers'). The asserted *what* gets through; the underlying *why* doesn't.\n\n**Bottom line.** Reliable for syntactic conversion. Expect to manually edit description strings to express behavior rather than restate assertions.",
            useCases: "- Migrating a test suite between frameworks\n- Aligning legacy tests to a team's preferred style\n- Onboarding to a new test framework by example"
          },
          {
            name: "Diagnose a flaky test",
            slug: "diagnose-flaky-test",
            description: "Given a test and its inconsistent failure logs, hypothesize root causes (timing, ordering, async, global state) and propose investigation steps.",
            prompt: "The following test fails intermittently. Hypothesize root causes and recommend investigation steps.\n\nTest code:\n```\n{{TEST_CODE}}\n```\n\nFailure log (samples):\n```\n{{FAILURES}}\n```",
            expectedOutput: "A ranked list of hypotheses (clock/time, test-order coupling, unawaited async, shared global state, network), each tied to evidence in the failure samples and paired with a concrete diagnostic step.",
            editorScore: 2,
            notes: "Knows the common flaky-test patterns (time, order coupling, unawaited async, global state, network). Without runtime trace data, output is a *list of plausible causes* rather than an identification. The right hypothesis is usually somewhere in the list.",
            rationale: "**What works.** The catalog of common flaky-test patterns is well-internalized — time/clock dependencies, test-order coupling, unawaited async, shared global state, race conditions in setup/teardown, network flakiness. The output enumerates plausible causes per symptom.\n\n**Where it breaks.** Identification, not enumeration. Without runtime trace data (timing observed, other tests that ran first, global state at the moment of failure), the model can only list possibilities. The actual root cause is usually in the list, but the model can't tell you which one with confidence.\n\n**Bottom line.** A hypothesis-generation step, not a diagnosis. Plan to reproduce and instrument.",
            useCases: "- Generating a starting checklist when you first encounter the flake\n- Pattern-matching a known flake symptom to its likely cause\n- Teaching what flaky-test root causes look like in practice"
          }
        ]
      },
      {
        name: "System Design",
        slug: "system-design",
        sortOrder: 4,
        tasks: [
          {
            name: "Design a rate limiter",
            slug: "design-rate-limiter",
            description: "Given throughput requirements and a distributed deployment, design a rate limiter — algorithm, storage backend, distributed correctness, and edge cases.",
            prompt: "Design a rate limiter for the following requirements:\n\n{{REQUIREMENTS}}\n\nCover:\n- Algorithm choice (with rationale)\n- Storage backend\n- Distributed correctness (atomicity, clock skew)\n- Edge cases (burst handling, eviction)",
            expectedOutput: "Algorithm justification (e.g. sliding window log vs token bucket), Redis-backed pseudocode using Lua scripts or atomic operations, handling of clock skew across nodes, and burst/eviction semantics.",
            editorScore: 4,
            notes: "Knows the canonical algorithms (fixed window, sliding window, token bucket, leaky bucket) and picks reasonable defaults. Often produces Redis pseudocode that uses non-atomic INCR/EXPIRE pairs where a Lua script is needed for correctness. Distributed gotchas (clock skew, master failover during increment) surface only when prompted.",
            rationale: "**What works.** Algorithm taxonomy and tradeoff comparison is well-covered — fixed window's burst-at-boundary issue, sliding window log's memory cost, token bucket's burst capacity, leaky bucket's smoothing. Algorithm choice for a given requirement is usually defensible.\n\n**Where it breaks.** Distributed correctness. Redis pseudocode often uses INCR followed by EXPIRE in two separate calls — non-atomic, leaves the counter immortal if EXPIRE fails. The correct form is a Lua script (or `SET ... EX ...` with a wrapper) but it surfaces only when prompted. Clock skew across nodes, master failover during increment, and eviction-under-pressure semantics rarely make the first draft.\n\n**Bottom line.** Production-quality algorithm selection and single-node implementation. Assume the first draft has at least one atomicity bug — review for distributed correctness.",
            useCases: "- First-draft rate limiter design before architectural review\n- Algorithm-comparison cheat sheet for an RFC\n- Teaching the rate-limiting algorithm taxonomy with worked examples"
          },
          {
            name: "Choose between SQL and NoSQL",
            slug: "sql-vs-nosql",
            description: "Given a use case, recommend SQL or a specific NoSQL family with clear reasoning about consistency, access patterns, and scale.",
            prompt: "Given this use case, recommend a database (SQL or specific NoSQL family) and justify the choice:\n\n{{USE_CASE}}\n\nCover: data model fit, consistency requirements, scale ceiling, query flexibility, and operational cost.",
            expectedOutput: "A specific recommendation (e.g. 'PostgreSQL with JSONB' or 'DynamoDB with single-table design') with reasoning tied to each requirement and explicit named tradeoffs.",
            editorScore: 3,
            notes: "Decision factors are well-internalized (ACID needs, schema rigidity, read/write ratio, scale ceiling). Strong bias toward recommending Postgres for almost everything. NoSQL recommendations tend to be vague about family (document vs wide-column vs key-value), treating DynamoDB and MongoDB as interchangeable when their access patterns differ sharply.",
            rationale: "**What works.** The decision factors are enumerated correctly — ACID consistency, schema rigidity, read/write ratio, access patterns, horizontal scale ceiling, operational cost. Tradeoff comparisons at a conceptual level are accurate.\n\n**Where it breaks.** Two biases. First, defaults to Postgres for almost everything — often correct, but a missed fit for genuinely document-shaped or extreme-scale workloads. Second, treats NoSQL as a single bucket — 'use NoSQL' without distinguishing DynamoDB's single-table-design constraints from MongoDB's document-model freedom. Operational tradeoffs (team expertise, runbook overhead, query flexibility for unknown future needs) get less weight than data-model fit.\n\n**Bottom line.** Useful for the first-pass outline. Don't outsource the actual decision — pattern bias and family blur affect output quality.",
            useCases: "- First-pass architecture decision document\n- Talking points for a 'which database' team discussion\n- Teaching the SQL/NoSQL decision factors to junior engineers"
          },
          {
            name: "Design cache invalidation strategy",
            slug: "cache-invalidation-strategy",
            description: "Given read/write patterns and consistency tolerance, choose an invalidation strategy (TTL, write-through, event-driven, versioned) and define concrete parameters.",
            prompt: "Design a caching layer with an invalidation strategy for the following access pattern:\n\n{{PATTERN}}\n\nCover:\n- Strategy choice (TTL, write-through, write-behind, event-driven, versioned keys)\n- Concrete parameters (TTL value, eviction policy, key namespace)\n- Distributed coordination (thundering herd, invalidation race during deploys)",
            expectedOutput: "A named strategy paired with concrete numbers (e.g. 60s TTL + 5min stale-while-revalidate), key naming conventions including versioning, and explicit handling of stampede + deploy-time invalidation.",
            editorScore: 3,
            notes: "Knows the named strategies (TTL, write-through, write-behind, cache-aside, event-driven, versioned keys). Stays at the strategy-name level without committing to concrete TTL values, even when consistency requirements are specified. Distributed-coordination concerns (stampede, deploy-race) surface only when prompted.",
            rationale: "**What works.** Named-strategy enumeration is reliable — TTL with stale-while-revalidate, write-through with synchronous invalidation, cache-aside with explicit busting, event-driven via pub/sub. The conceptual mapping from access pattern to strategy is sound.\n\n**Where it breaks.** Translating consistency requirements to concrete parameters. 'Mostly fresh, can tolerate 5 minutes of staleness' should produce a specific TTL of 60 seconds (with stale-while-revalidate up to 5 minutes), but the model usually stays at the strategy-name level. Distributed cache coordination (thundering herd on cache miss, invalidation race during deploys) rarely surfaces unprompted.\n\n**Bottom line.** Strategy-selection layer is solid. Concrete-parameter layer needs human input — first draft picks the right pattern but with the wrong numbers.",
            useCases: "- Cache-strategy section of a design doc\n- Comparing options when you know the constraints\n- Onboarding new engineers to your caching conventions"
          },
          {
            name: "Sketch REST API for a feature",
            slug: "sketch-rest-api",
            description: "Given a feature description, design a REST API surface — resources, HTTP verbs, request/response shapes, pagination, errors.",
            prompt: "Design a REST API for the following feature:\n\n{{FEATURE}}\n\nCover: resource modeling, HTTP verbs, request/response JSON shapes, pagination, error model, and rate-limit headers.",
            expectedOutput: "A complete endpoint listing with paths, verbs, request bodies, response shapes, status codes, pagination scheme (consistently cursor OR offset), and a uniform error structure.",
            editorScore: 4,
            notes: "REST conventions land: resource URLs, HTTP verb semantics, status codes. Two recurring issues — over-modeling (sub-resources for things that should be query params), and pagination inconsistency (cursor for one endpoint, offset for another) within the same spec.",
            rationale: "**What works.** REST conventions are essentially memorized — collection/resource URL structure (`/users` / `/users/:id`), correct HTTP verb semantics, sensible status codes (201, 204, 422), idempotent vs unsafe operations. JSON request/response shapes are reasonable.\n\n**Where it breaks.** Over-modeling — creates a sub-resource for what should be a query parameter (e.g., `/users/:id/active-status` instead of `?active=true`). Pagination drifts inside a single spec — cursor-based for one endpoint, offset for another. Real-world concerns like idempotency keys, partial-failure semantics on bulk endpoints, and rate-limit headers usually need explicit prompting.\n\n**Bottom line.** Good first sketch. Trim the over-modeling, standardize the pagination, and add the operational headers before considering it design-doc ready.",
            useCases: "- API design first draft for a new feature\n- Reviewing your draft against REST conventions\n- Teaching REST resource modeling to backend juniors"
          }
        ]
      },
      {
        name: "Debugging",
        slug: "debugging",
        sortOrder: 5,
        tasks: [
          {
            name: "Read stack trace and propose fix",
            slug: "read-stack-trace",
            description: "Given an exception stack trace and the relevant source file, identify the root cause and propose a code fix.",
            prompt: "Given the following stack trace and code context, identify the root cause and propose a fix.\n\nStack trace:\n```\n{{TRACE}}\n```\n\nCode context (the file mentioned at the top of the trace):\n```\n{{CODE}}\n```",
            expectedOutput: "Root cause identification at a specific line, a corrected code snippet, and an explanation of when the bug triggers.",
            editorScore: 4,
            notes: "Strong on common exception types — NullPointerException/TypeError on undefined access, KeyError on missing dict key, IndexError on out-of-bounds. Falls down on framework-internal traces (Django middleware, React fiber, async generators) where user code is buried 20 frames deep.",
            rationale: "**What works.** Common exception patterns are pattern-matched reliably — `'NoneType' object has no attribute 'x'` resolves to 'check why this variable is None at line N', `KeyError` resolves to 'this dict access lacks a guard'. The proposed fix is usually correct and uses the language's idiomatic safety primitive.\n\n**Where it breaks.** Framework-internal traces where the user-code line is buried deep in the call stack (Django middleware exception, React fiber render error, async generator unwind). The model focuses on the topmost frame rather than walking down to find the user-code culprit. Custom exception types defined in your codebase get treated as opaque rather than read for context.\n\n**Bottom line.** Reliable for direct exceptions in straightforward call chains. Less useful for framework-deep traces — you still need to read the codebase.",
            useCases: "- First-pass triage on a stack trace before opening a debugger\n- Teaching juniors how to read traces and locate the user-code frame\n- Quick fix proposal for common errors during incident response"
          },
          {
            name: "Diagnose 'works on my machine'",
            slug: "diagnose-works-on-my-machine",
            description: "When code works locally but fails on a colleague's setup or CI, generate a symptom-guided diagnostic checklist.",
            prompt: "Code that works on my machine fails on a colleague's. Generate a systematic diagnostic checklist tailored to the symptom.\n\nSymptom: {{SYMPTOM}}\nLocal environment: {{LOCAL_ENV}}\nRemote environment: {{REMOTE_ENV}}",
            expectedOutput: "A prioritized checklist of environmental differences (versions, env vars, OS, locale, timezone, filesystem case), tailored to the symptom — segfaults prioritize architecture, wrong output prioritizes locale.",
            editorScore: 3,
            notes: "Generates a reasonable checklist (env vars, OS/arch, runtime version, dependency versions, filesystem case sensitivity, locale, time zone). Generic — same checklist regardless of symptom, when the symptom should actually guide which checks matter.",
            rationale: "**What works.** The diagnostic taxonomy is solid — environment variables, OS/architecture differences, language/runtime version, dependency lockfile drift, filesystem case sensitivity, locale, timezone, hidden config files, IDE settings not in the repo. Ordering by likelihood and cost is reasonable.\n\n**Where it breaks.** Symptom-aware narrowing. A 'segfault' symptom should prioritize architecture and binary-dependency checks; a 'wrong output' symptom should prioritize locale and floating-point determinism. The model produces the same comprehensive checklist regardless, leaving you to prioritize manually.\n\n**Bottom line.** Comprehensive baseline checklist. Bring the symptom-specific prioritization yourself.",
            useCases: "- Onboarding doc for a 'works on my machine' template\n- Reviewing what you've already checked vs. what's left\n- Teaching juniors what env divergence looks like in practice"
          },
          {
            name: "Find off-by-one in a loop",
            slug: "find-off-by-one",
            description: "Review a loop for off-by-one errors and identify the failing boundary condition.",
            prompt: "Review the following loop for off-by-one errors. Identify each one, explain the boundary condition that fails, and provide a corrected version.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of `<=` vs `<` errors, wrong start index, exclusive vs inclusive slice boundaries, count-vs-index confusion. Each finding paired with the failing input and the corrected loop.",
            editorScore: 4,
            notes: "Reliable on classic patterns (`<=` instead of `<` on the bound, `i = 1` start instead of `0`, slice boundaries). Misses domain-boundary cases like circular-buffer wraparound where the off-by-one depends on external semantics.",
            rationale: "**What works.** Classic patterns are pattern-matched well — `<=` instead of `<` on the bound, `i = 1` start instead of `0`, slice boundaries off by one, count-vs-index confusion. The boundary condition is correctly identified and the fix is correct.\n\n**Where it breaks.** Domain-specific boundary semantics. An 'iterate pairs in a circular buffer' loop where the wraparound condition determines whether `(N-1, 0)` is a valid pair takes more context than the model can infer from the loop alone. Same for inclusive/exclusive ranges that are correct given an external convention.\n\n**Bottom line.** Reliable on textbook off-by-ones. For domain-boundary code, treat as a smell-check rather than a verdict.",
            useCases: "- PR review smell check on numeric-loop changes\n- Teaching boundary-condition reasoning by counterexample\n- Generating a checklist of bounds to verify with property tests"
          },
          {
            name: "Debug intermittent network call",
            slug: "debug-intermittent-network",
            description: "Given client code and intermittent failure samples, hypothesize root causes and recommend instrumentation.",
            prompt: "An HTTP call to a downstream service fails intermittently. Hypothesize root causes and recommend investigation steps.\n\nClient code:\n```\n{{CODE}}\n```\n\nFailure samples:\n```\n{{FAILURES}}\n```",
            expectedOutput: "Ranked hypothesis list (transient TCP reset, TLS handshake under load, timeout mismatch, connection pool exhaustion, DNS flakiness, LB rotation), each paired with a concrete diagnostic step (logs to enable, traces to capture).",
            editorScore: 2,
            notes: "Enumerates standard intermittent-network causes (TCP reset, TLS handshake failure, timeout mismatch, pool exhaustion, DNS flakiness, LB health-check). Without runtime traces or packet captures, can't identify which — output is hypothesis list, not diagnosis.",
            rationale: "**What works.** The catalog of intermittent-network causes is well-rehearsed: transient TCP reset, TLS handshake failure under load, your timeout shorter than downstream's response, connection pool exhaustion, DNS resolution flakiness, load-balancer rotating an unhealthy backend in/out. Recommended investigation steps (verbose logging, request IDs, network capture) are reasonable.\n\n**Where it breaks.** Identification requires data the model can't observe — packet captures, distributed tracing spans, downstream logs. Without these, output is necessarily a hypothesis list to work through.\n\n**Bottom line.** Useful starting point. The actual debug work is observation and instrumentation, which the model cannot perform for you.",
            useCases: "- Generating a hypothesis list when first investigating\n- Onboarding doc for 'how to debug a flaky external call'\n- Reminding yourself which signals to capture during incident response"
          }
        ]
      },
      {
        name: "Refactoring",
        slug: "refactoring",
        sortOrder: 6,
        tasks: [
          {
            name: "Extract method",
            slug: "extract-method",
            description: "Refactor a long function by extracting a marked block into a well-named helper, preserving behavior.",
            prompt: "Refactor the function below by extracting the marked block into a well-named helper. Preserve behavior exactly — including any mutation semantics.\n\n```\n{{CODE}}\n```",
            expectedOutput: "An extracted helper with the correct parameter list and return value, an updated call site, and preserved mutation semantics if the original mutated shared state.",
            editorScore: 5,
            notes: "Extraction itself is essentially deterministic — variable scope analysis, parameter passing, return value collection. Behavior preservation is reliable for pure code. Where extraction touches mutable state shared with the parent scope, occasional silent semantic changes (returning a copy where the original mutated in place).",
            rationale: "**What works.** Pure-function extraction is nearly mechanical and lands reliably. The extracted helper has the right parameters, returns the right value, and the call site is correctly updated. Variable-scope analysis (closure vs parameter) is handled correctly.\n\n**Where it breaks.** Mutable state shared with the parent scope. When the extracted block was mutating a variable that the parent continued to use, the extracted helper sometimes returns a copy instead of mutating in place — a subtle behavior change. Closures over loop variables (the classic `for + setTimeout` issue) are also occasionally mishandled when extraction crosses the loop boundary.\n\n**Bottom line.** Production-ready for pure code. Review carefully when the extracted block was sharing mutable state with its surroundings.",
            useCases: "- Continuous refactoring during feature development\n- Decomposing legacy long functions into reviewable units\n- Teaching the extract-method pattern by worked example"
          },
          {
            name: "Convert callbacks to async/await",
            slug: "callbacks-to-async-await",
            description: "Convert Node.js callback-style code to async/await, preserving error handling.",
            prompt: "Convert the following Node.js callback-style code to use async/await. Preserve error handling semantics and any flow control. If a callback fires multiple times, note that the conversion is not straightforward.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Linear async/await code with try/catch matching the original error-first callback semantics. Single-fire callbacks become awaits; multi-fire callbacks (event emitters, streams) flagged rather than silently dropped.",
            editorScore: 5,
            notes: "Pattern-matched conversion lands first try — error-first callbacks become try/catch, nested callbacks flatten. Edge case: callbacks that fire multiple times (event emitters, stream `data` callbacks) are sometimes incorrectly converted to a single await, losing subsequent events.",
            rationale: "**What works.** Standard error-first Node callbacks (`(err, data) => ...`) translate cleanly to `try { const data = await fn() } catch (err) { ... }`. Promisification of older APIs (via `util.promisify` or `fs/promises`) is applied correctly. Nested callbacks flatten into a linear async sequence.\n\n**Where it breaks.** Multi-fire callbacks — event emitter `data` callbacks, stream `read` callbacks, observer patterns — get incorrectly converted to a single await, dropping events after the first. Same for callbacks that are intentionally fire-and-forget where the conversion adds an unnecessary await.\n\n**Bottom line.** Production-ready for one-shot async patterns. Read carefully when the original callback fires more than once.",
            useCases: "- Modernizing a legacy Node.js codebase\n- Teaching the callback-to-async transformation by example\n- Code review fix for nested-callback PRs"
          },
          {
            name: "Reduce cyclomatic complexity",
            slug: "reduce-cyclomatic-complexity",
            description: "Refactor a function with high cyclomatic complexity using guard clauses, lookup tables, or polymorphism — without over-decomposition.",
            prompt: "Refactor the following function to reduce cyclomatic complexity. Use guard clauses, early returns, lookup tables, or polymorphism where appropriate. Do not over-decompose — readability matters more than the metric.\n\n```\n{{CODE}}\n```",
            expectedOutput: "A refactored function with measurably lower cyclomatic complexity, using named patterns from Fowler's catalog. The transformation should not produce a 'function soup' of tiny single-purpose helpers.",
            editorScore: 4,
            notes: "Applies guard clauses and early returns reliably. Knows the named refactoring catalog. Occasionally over-refactors — splits a 10-line function into 5 single-purpose helpers where the inlined version was readable.",
            rationale: "**What works.** Named refactoring patterns from Fowler's catalog are well-internalized — guard clauses for nested `if (x) { if (y) { ... } }`, early returns to flatten validation, lookup tables for switch-on-type, replace-conditional-with-polymorphism for class hierarchies. The transformed code measurably reduces complexity.\n\n**Where it breaks.** Knowing when to stop. Sometimes splits a 10-line function into 5 single-purpose helpers where the inlined version was perfectly readable. Doesn't weigh the cognitive cost of cross-function navigation against the local complexity score.\n\n**Bottom line.** Good when complexity is genuinely too high. Review for over-decomposition — a low metric isn't free if it produces function-soup.",
            useCases: "- Bringing a 'complexity warning' down past the linter threshold\n- Teaching the refactoring catalog with concrete examples\n- Reviewing nested-conditional PRs"
          },
          {
            name: "Rename for clarity",
            slug: "rename-for-clarity",
            description: "Propose better names for variables and functions in a snippet, with justification grounded in role and scope.",
            prompt: "Propose better names for the variables and functions marked TODO. Justify each name by role and scope. Avoid generic placeholders (data, result, value) when domain language is available.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Name proposals with one-line justifications. Names should be concise (avoid `calculateTotalPriceIncludingTaxAndDiscounts`) and use domain vocabulary when context provides it.",
            editorScore: 3,
            notes: "Generates plausible names that capture role. Tendency toward verbose (`calculateTotalPriceIncludingTaxAndDiscounts` instead of `totalPrice`) and toward generic safe choices (`data`, `result`, `value`) when domain-specific naming would be clearer. Doesn't check for collisions with existing identifiers.",
            rationale: "**What works.** Names capture role accurately — a sum function gets a `compute`/`calculate` prefix, a boolean predicate gets `is`/`has`, a getter follows language convention. The transformation does communicate purpose.\n\n**Where it breaks.** Two persistent issues. Verbosity bias — `calculateTotalPriceIncludingTaxAndDiscounts` where `totalPrice` would suffice in context. Generic fallbacks — `data`, `result`, `value` when the local context calls for domain language (`invoice`, `aggregatedReport`). Doesn't check for collisions with existing identifiers in the surrounding scope.\n\n**Bottom line.** Useful as a brainstorm. Accept names that genuinely read better, override the over-verbose ones, and grep for collisions before applying.",
            useCases: "- Brainstorming names during a PR review when stuck\n- Bulk renaming pass for a consistency cleanup\n- Teaching naming conventions to new team members"
          }
        ]
      },
      {
        name: "Performance Optimization",
        slug: "performance",
        sortOrder: 7,
        tasks: [
          {
            name: "Fix N+1 query",
            slug: "fix-n-plus-one",
            description: "Identify the N+1 query pattern in ORM code and rewrite using eager loading or batch fetch.",
            prompt: "Identify the N+1 query pattern in the following ORM code and rewrite it to use a single query (or constant-N queries). Use eager loading (`include`/`select_related`/`with`/`joinedload`) or batch loading.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of the N+1 site, a rewrite using the correct ORM eager-loading primitive, and a note on whether joinedload or subqueryload is more appropriate for the relation cardinality.",
            editorScore: 4,
            notes: "Pattern recognition is near-perfect for classic shapes (loop calling `.find()` inside, lazy-loaded relations accessed in render). Eager-loading syntax correct. On 3+ level relation chains, eager-load shape is sometimes wrong (joinedload where subqueryload is faster).",
            rationale: "**What works.** Recognition is near-perfect — `for user in users: user.posts.all()` is identified instantly, with the fix using the correct ORM eager-loading primitive (`.includes(:posts)` for Rails, `.options(joinedload(User.posts))` for SQLAlchemy, `.populate('posts')` for Mongoose, `.select_related('posts')` for Django). The N+1 → 1 transformation is mechanical and reliable.\n\n**Where it breaks.** Deep relation chains. When the eager-load needs to traverse 3+ levels (`User → Posts → Comments → Author`), the choice between joinedload and subqueryload depends on cardinality at each level — flat JOINs explode rows when cardinality is high. The model picks a default that often works but isn't always optimal.\n\n**Bottom line.** Production-ready for the typical two-level N+1. Verify the eager-load strategy on deep chains by checking actual query count and row count in EXPLAIN.",
            useCases: "- Quick fix during a slow-page investigation\n- PR review pattern check on new ORM code\n- Teaching the N+1 anti-pattern with concrete examples"
          },
          {
            name: "Reduce React re-renders",
            slug: "reduce-react-rerenders",
            description: "Analyze a React component for unnecessary re-renders and recommend memoization, restructuring, or context refactoring.",
            prompt: "Analyze this React component for unnecessary re-renders. Recommend `useMemo`, `useCallback`, `React.memo`, key stability, or component restructuring. Note: prioritize candidates worth profiling rather than wrapping everything in memoization.\n\n```\n{{CODE}}\n```",
            expectedOutput: "A ranked list of likely re-render causes (Context churn, unstable callback identity, missing memo on heavy children, unstable keys) with proposed fixes. Recommends profiling before applying.",
            editorScore: 3,
            notes: "Knows the optimization primitives (useMemo, useCallback, React.memo, key stability). Over-applies them — sprinkles useMemo on cheap computations where memoization costs more than recomputation. Doesn't know what's actually slow.",
            rationale: "**What works.** The primitive toolset is well-known — `useMemo` for expensive derived values, `useCallback` for stable function identity passed to memoized children, `React.memo` for component-level memoization, key stability for list reconciliation. The named primitives are applied with correct syntax.\n\n**Where it breaks.** The model doesn't know what's actually slow in your component. It sprinkles `useMemo` on cheap computations (a simple `.filter()` on a 5-element array) where memoization costs more than the savings, and adds `useCallback` to handlers never passed to memoized children. Real causes — Context providers re-rendering all consumers, oversized component trees without `React.memo` boundaries — get the same generic 'wrap in useMemo' treatment.\n\n**Bottom line.** Profile first with React DevTools. Use the output as a checklist of *candidate* optimizations to validate, not a list of actual fixes.",
            useCases: "- Generating a checklist of memoization candidates to profile\n- Teaching the optimization primitives with code examples\n- Code review starter for performance-sensitive components"
          },
          {
            name: "Vectorize Python loop",
            slug: "vectorize-python-loop",
            description: "Convert an imperative NumPy/Pandas loop to vectorized form, with a note on expected speedup and correctness checks.",
            prompt: "Convert the following imperative Python loop to a vectorized NumPy or Pandas equivalent. Preserve behavior exactly — flag any cross-iteration dependencies that prevent simple vectorization.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Vectorized equivalent using broadcasting, boolean masking, or groupby aggregations. One-line speedup estimate. If cross-row dependencies exist, an explicit note that vectorization changes semantics.",
            editorScore: 5,
            notes: "Standard vectorization patterns (element-wise, boolean masking, groupby aggregations, broadcasting) translate reliably. Less reliable on conditional logic with cross-row dependencies — the conversion sometimes silently changes semantics when the original loop relied on iteration order.",
            rationale: "**What works.** Standard vectorization translates cleanly — `for i in range(len(arr)): arr[i] = arr[i] * 2` becomes `arr * 2`, boolean filters become `arr[arr > threshold]`, group-by aggregations become `.groupby().agg()`, broadcasting handles different-shape array math. Output is idiomatic and speedup claims are usually accurate.\n\n**Where it breaks.** Loops with cross-row dependencies — accumulating state that depends on the previous iteration, or branching based on earlier results — sometimes get vectorized in a way that silently drops the dependency. The output looks faster and runs without errors but computes a different answer.\n\n**Bottom line.** Production-ready for stateless transformations and standard aggregations. Validate correctness explicitly when the original loop maintained state across iterations.",
            useCases: "- Performance pass on data-processing notebooks\n- Modernizing legacy Pandas/NumPy code\n- Teaching vectorization patterns to data scientists"
          },
          {
            name: "Add caching layer",
            slug: "add-caching-layer",
            description: "Add a memoization or Redis-backed cache to an expensive function, with stampede protection and key namespacing.",
            prompt: "Add a caching layer (in-memory or Redis) to the function below. Cover: cache key derivation, TTL, stampede protection, and key namespacing across deploys.\n\n```\n{{CODE}}\n```",
            expectedOutput: "A wrapper using the appropriate caching library (`functools.lru_cache`, `cachetools`, Redis with TTL), with explicit key derivation, stampede protection (lock or probabilistic early refresh), and versioned key namespace.",
            editorScore: 3,
            notes: "Picks reasonable defaults (`functools.lru_cache` for in-memory, Redis with TTL for shared). Cache key derivation usually correct for simple arguments. Misses subtler cases: cache stampede on simultaneous misses, key namespacing across deploy boundaries, unstable hashing on object arguments.",
            rationale: "**What works.** Library choice is sensible — `functools.lru_cache` for in-process, Redis with `SET ... EX ...` for shared, `cachetools` for more control. Cache keys for simple argument types (strings, ints, immutable tuples) are derived correctly. TTL value is a reasonable default.\n\n**Where it breaks.** Cache stampede — when many requests miss simultaneously and all hit the backend, the generated code doesn't handle this (no lock, no probabilistic early refresh). Key namespacing across deploys is also a recurring miss — a cache key like `user:123:profile` survives across schema changes that should invalidate it. Argument hashing for objects with unstable `__hash__` produces non-deterministic keys.\n\n**Bottom line.** Solid baseline for the typical cache layer. Review for stampede protection and deploy-time invalidation if either matters.",
            useCases: "- First-cut cache addition during a performance investigation\n- Teaching caching strategies with working code\n- Pattern reminder when you know the structure but not the library API"
          }
        ]
      },
      {
        name: "Security",
        slug: "security",
        sortOrder: 8,
        tasks: [
          {
            name: "Audit auth flow for bypass",
            slug: "audit-auth-bypass",
            description: "Review an authentication/authorization flow for missing checks, IDOR, privilege escalation, and session-handling bugs.",
            prompt: "Review the following authentication/authorization flow for bypass vulnerabilities. Cover: missing checks, IDOR, privilege escalation, session handling, JWT algorithm confusion.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of missing middleware, IDOR sites (direct object reference without ownership check), privilege-escalation paths, session-handling bugs, and JWT-specific issues with concrete remediation.",
            editorScore: 3,
            notes: "Catches missing auth middleware, IDOR (direct object reference without ownership check), and weak session tokens. Misses TOCTOU between check and access, privilege escalation through role-change endpoints, and JWT 'none' algorithm acceptance with default library config.",
            rationale: "**What works.** Named bypass patterns are catalogued — missing `@require_auth` decorators, direct object reference like `/users/:id/orders/:order_id` without ownership check, weak session token entropy, session fixation. Detection in straightforward code is reliable.\n\n**Where it breaks.** Time-of-check / time-of-use races (auth checked, permissions change before resource access). Privilege escalation through legitimate endpoints (a 'change my role' endpoint that doesn't re-verify). JWT-specific gotchas — `alg: none` acceptance, RS256/HS256 key confusion, refresh tokens leaking via logs — surface unevenly.\n\n**Bottom line.** First-pass IDOR and missing-check detection works. For deeper bypass analysis, treat as one signal among several and plan manual review.",
            useCases: "- First-pass security review on a PR touching auth\n- Onboarding doc for 'what to look for' in auth review\n- Generating a checklist for an internal security audit"
          },
          {
            name: "Hash password correctly",
            slug: "hash-password-correctly",
            description: "Show correct password hashing using bcrypt, argon2, or scrypt — salting, cost factor, verification semantics.",
            prompt: "Show how to hash and verify a password using {{LIBRARY}} (bcrypt, argon2id, scrypt). Cover: automatic salt handling, current-consensus cost factor, and constant-time verification.\n\n```\n{{CONTEXT}}\n```",
            expectedOutput: "Correct library usage — `bcrypt.hash()`/`compare()`, `argon2id` with sensible memory/iterations, `scrypt` with appropriate N/r/p. Salt managed by the library. Cost factor at current OWASP recommendation. Verification using the library's constant-time compare.",
            editorScore: 5,
            notes: "Patterns are essentially memorized — correct library calls, salts handled automatically, constant-time comparison. One subtle issue: cost factor recommendations sometimes lag current consensus (suggests bcrypt cost 10 when 12+ is current); easy to override.",
            rationale: "**What works.** Password hashing best practices are well-documented in training data and the output reflects current consensus — bcrypt's `hash()` and `compare()` (salt automatic), argon2's `argon2id` variant with sensible memory/iterations, scrypt with appropriate N/r/p. Verification uses constant-time comparison via the library's own function. Salt-per-hash invariant is preserved.\n\n**Where it breaks.** Cost-factor recommendations occasionally lag current consensus — suggesting bcrypt cost 10 when 12+ is the modern minimum. Easy to override with explicit input, but the default isn't always current.\n\n**Bottom line.** Production-ready. Verify the cost factor against current OWASP recommendations for your year and threat model.",
            useCases: "- Writing or reviewing the password storage layer\n- Teaching juniors why parameter tuning matters\n- Pattern reminder when you forget the library API"
          },
          {
            name: "Validate JWT correctly",
            slug: "validate-jwt",
            description: "Validate a JWT with all critical security checks — signature, algorithm allowlist, audience, issuer, expiration.",
            prompt: "Write JWT validation code using {{LIBRARY}}. Cover: signature verification, algorithm allowlist (reject 'none' and reject permissive arrays that enable RS256/HS256 confusion), exp/nbf/iat checks, aud and iss matching with exact rather than 'any-of' semantics.\n\n```\n{{CONTEXT}}\n```",
            expectedOutput: "Validation code that explicitly pins a single algorithm (or a tight allowlist), checks all standard claims, and uses strict (not permissive) audience/issuer matching. Rejects malformed tokens before any logic runs.",
            editorScore: 4,
            notes: "Covers signature, expiration, audience, issuer, algorithm allowlist. Easy to misconfigure — sometimes passes algorithm as `['RS256', 'HS256']` to be 'flexible,' which opens the RS256/HS256 key confusion attack.",
            rationale: "**What works.** The named checks all appear — signature verification, `exp` (expiration), `nbf` (not-before), `iat` (issued-at sanity), `iss` (issuer match), `aud` (audience match), algorithm allowlist. Library calls use the correct parameter names.\n\n**Where it breaks.** Two subtle misconfigurations. Audience and issuer are sometimes accepted as 'any of these' when 'exactly this' is intended. The algorithm parameter is sometimes passed as `['RS256', 'HS256']` to be 'flexible,' which opens the RS256/HS256 key confusion attack — the model occasionally produces this without flagging the risk.\n\n**Bottom line.** Skeleton correct. Review the algorithm parameter (single algorithm or narrow allowlist) and the audience/issuer matching strictness.",
            useCases: "- Building or reviewing a JWT validation middleware\n- Teaching the JWT claims security catalog\n- Defending against algorithm-confusion attacks during a security review"
          },
          {
            name: "Detect XSS in HTML template",
            slug: "detect-xss-template",
            description: "Review an HTML/JSX/Vue template for XSS vulnerabilities (direct injection, stored XSS, DOM clobbering).",
            prompt: "Review the following template/component for XSS vulnerabilities. Identify each unsafe rendering and propose a safe alternative. Cover: direct injection (innerHTML, dangerouslySetInnerHTML, v-html), stored XSS via serialized state, and DOM clobbering via user-controlled IDs.\n\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of each unsafe sink with a corrected version using framework escaping or a sanitization library (DOMPurify, bleach). Stored XSS and DOM clobbering flagged explicitly.",
            editorScore: 4,
            notes: "Strong on direct injection — `innerHTML = userInput`, `dangerouslySetInnerHTML`, `v-html`, raw template interpolation. Misses subtler vectors: stored XSS through serialized state (a JSON blob containing `<script>` that survives serialization), and DOM clobbering through framework-rendered IDs.",
            rationale: "**What works.** Direct-injection sinks are pattern-matched well — `innerHTML`/`outerHTML` assignments, `dangerouslySetInnerHTML`, `v-html`, raw Pug/Handlebars/Jinja interpolations, attribute injection via dynamic `href`/`onclick`. The model produces safe-alternative code using framework escaping or a sanitization library (`DOMPurify`, `bleach`).\n\n**Where it breaks.** Stored XSS through serialized state — a user-controlled JSON blob containing `<script>` survives `JSON.stringify`/`parse` and gets injected when later rendered without escaping. DOM clobbering via user-controlled `id` attributes (which then shadow `document.getElementById` calls). Mutation XSS where sanitizers parse the input differently from the final renderer. These need explicit prompting to surface.\n\n**Bottom line.** Reliable on direct sinks. For defense-in-depth XSS review, add explicit prompts about stored XSS and DOM clobbering, or pair with a static analysis tool.",
            useCases: "- PR review smell check for new template code\n- Onboarding doc for XSS patterns per framework\n- First-pass scan before commissioning a pen-test"
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
  let totalCategories = 0;

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
      totalCategories++;

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

  console.log(`Seed complete. ${SEED_DATA.length} domains, ${totalCategories} categories, ${totalTasks} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
