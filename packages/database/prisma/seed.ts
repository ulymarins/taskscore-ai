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
