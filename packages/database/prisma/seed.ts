import { PrismaClient } from "../generated/client"

const prisma = new PrismaClient()

async function main() {
  // ── AI Models ────────────────────────────────────────────────────────────
  const models = await Promise.all([
    prisma.aiModel.upsert({
      where: { slug: "gpt-4o" },
      update: {},
      create: { name: "GPT-4o", slug: "gpt-4o", provider: "OpenAI" },
    }),
    prisma.aiModel.upsert({
      where: { slug: "gpt-4-turbo" },
      update: {},
      create: { name: "GPT-4 Turbo", slug: "gpt-4-turbo", provider: "OpenAI" },
    }),
    prisma.aiModel.upsert({
      where: { slug: "claude-sonnet-4-6" },
      update: {},
      create: { name: "Claude Sonnet 4.6", slug: "claude-sonnet-4-6", provider: "Anthropic" },
    }),
    prisma.aiModel.upsert({
      where: { slug: "claude-opus-4-6" },
      update: {},
      create: { name: "Claude Opus 4.6", slug: "claude-opus-4-6", provider: "Anthropic" },
    }),
    prisma.aiModel.upsert({
      where: { slug: "gemini-2-5-pro" },
      update: {},
      create: { name: "Gemini 2.5 Pro", slug: "gemini-2-5-pro", provider: "Google" },
    }),
    prisma.aiModel.upsert({
      where: { slug: "gemini-2-5-flash" },
      update: {},
      create: { name: "Gemini 2.5 Flash", slug: "gemini-2-5-flash", provider: "Google" },
    }),
  ])

  console.log(`Seeded ${models.length} AI models`)

  // ── Domain: Software Engineering ─────────────────────────────────────────
  const sweDomain = await prisma.domain.upsert({
    where: { slug: "software-engineering" },
    update: {},
    create: {
      name: "Software Engineering",
      slug: "software-engineering",
      description: "AI readiness across the modern software development lifecycle.",
      sortOrder: 1,
    },
  })

  // Category: Observability
  const observability = await prisma.category.upsert({
    where: { domainId_slug: { domainId: sweDomain.id, slug: "observability" } },
    update: {},
    create: {
      name: "Observability",
      slug: "observability",
      domainId: sweDomain.id,
      sortOrder: 1,
    },
  })

  await prisma.task.upsert({
    where: { categoryId_slug: { categoryId: observability.id, slug: "parse-unstructured-server-logs" } },
    update: {},
    create: {
      name: "Parse unstructured server logs",
      slug: "parse-unstructured-server-logs",
      categoryId: observability.id,
      description:
        "Given a raw dump of mixed-format server logs (nginx, app, syslog), extract structured error events with timestamp, severity, service name, and message.",
      prompt:
        `You are a log parsing assistant. I will provide raw server log output.\n\nExtract all ERROR and WARN level events and return them as a JSON array with this shape:\n[\n  {\n    "timestamp": "ISO-8601",\n    "severity": "ERROR" | "WARN",\n    "service": "string",\n    "message": "string"\n  }\n]\n\nReturn only the JSON array. No explanation.\n\nLogs:\n{{LOGS}}`,
      expectedOutput:
        `A valid JSON array of structured log objects. Timestamps normalized to ISO-8601. No prose, no markdown fences — raw JSON only.`,
      editorScore: 4,
      notes:
        "Performs reliably on nginx and standard syslog formats. Struggles when log lines are truncated mid-entry or when custom formats lack a recognizable timestamp prefix.",
      publishedAt: new Date(),
    },
  })

  await prisma.task.upsert({
    where: { categoryId_slug: { categoryId: observability.id, slug: "write-prometheus-alert-rules" } },
    update: {},
    create: {
      name: "Write Prometheus alert rules",
      slug: "write-prometheus-alert-rules",
      categoryId: observability.id,
      description:
        "Given a description of a service SLA and failure conditions, generate a valid Prometheus alerting rule YAML file with appropriate thresholds and labels.",
      prompt:
        `Write a Prometheus alerting rule file in YAML for the following scenario:\n\n{{SCENARIO}}\n\nRequirements:\n- Use 'groups' structure\n- Include 'for' duration to avoid flapping\n- Add severity label (critical / warning)\n- Add a runbook_url annotation placeholder\n\nReturn only valid YAML.`,
      expectedOutput:
        `A syntactically valid Prometheus alert rule YAML with at least one alert group, correct PromQL expressions, duration guards, and severity + runbook_url annotations.`,
      editorScore: 3,
      notes:
        "PromQL expressions are often syntactically correct but semantically wrong — thresholds are generic and require human tuning for the specific service.",
      publishedAt: new Date(),
    },
  })

  // Category: Code Review
  const codeReview = await prisma.category.upsert({
    where: { domainId_slug: { domainId: sweDomain.id, slug: "code-review" } },
    update: {},
    create: {
      name: "Code Review",
      slug: "code-review",
      domainId: sweDomain.id,
      sortOrder: 2,
    },
  })

  await prisma.task.upsert({
    where: { categoryId_slug: { categoryId: codeReview.id, slug: "identify-sql-injection-risk" } },
    update: {},
    create: {
      name: "Identify SQL injection risk",
      slug: "identify-sql-injection-risk",
      categoryId: codeReview.id,
      description:
        "Review a code snippet and identify all SQL injection vulnerabilities, explaining the risk and providing a parameterized query fix.",
      prompt:
        `Review the following code for SQL injection vulnerabilities.\n\nFor each vulnerability found:\n1. Quote the exact vulnerable line(s)\n2. Explain the attack vector\n3. Provide a corrected version using parameterized queries\n\nCode:\n\`\`\`\n{{CODE}}\n\`\`\``,
      expectedOutput:
        `A structured review listing each vulnerable line, the injection vector, and a corrected parameterized version. Should catch all string interpolation into SQL strings.`,
      editorScore: 5,
      notes: "One of the strongest use cases. AI consistently catches direct string interpolation vulnerabilities across Python, JS, PHP, and Ruby.",
      publishedAt: new Date(),
    },
  })

  await prisma.task.upsert({
    where: { categoryId_slug: { categoryId: codeReview.id, slug: "review-for-race-conditions" } },
    update: {},
    create: {
      name: "Review for race conditions",
      slug: "review-for-race-conditions",
      categoryId: codeReview.id,
      description:
        "Analyze concurrent or async code and identify potential race conditions, explaining when the hazard occurs and how to fix it with proper synchronization.",
      prompt:
        `Review the following concurrent code for race conditions and thread-safety issues.\n\nFor each issue:\n1. Identify the specific lines involved\n2. Describe the exact scenario in which the race occurs\n3. Suggest a fix (mutex, atomic, channel, etc.)\n\nCode:\n\`\`\`\n{{CODE}}\n\`\`\``,
      expectedOutput:
        `Identification of all shared-state hazards, timing-dependent bugs, and unsafe concurrent access patterns with correct synchronization fixes.`,
      editorScore: 2,
      notes:
        "Highly inconsistent. Catches obvious shared-variable mutations but misses subtle async hazards and distributed race conditions almost entirely.",
      publishedAt: new Date(),
    },
  })

  // ── Domain: Legal ─────────────────────────────────────────────────────────
  const legalDomain = await prisma.domain.upsert({
    where: { slug: "legal" },
    update: {},
    create: {
      name: "Legal",
      slug: "legal",
      description: "AI readiness for legal document analysis, drafting, and research.",
      sortOrder: 2,
    },
  })

  const contracts = await prisma.category.upsert({
    where: { domainId_slug: { domainId: legalDomain.id, slug: "contracts" } },
    update: {},
    create: {
      name: "Contracts",
      slug: "contracts",
      domainId: legalDomain.id,
      sortOrder: 1,
    },
  })

  await prisma.task.upsert({
    where: { categoryId_slug: { categoryId: contracts.id, slug: "extract-key-contract-dates" } },
    update: {},
    create: {
      name: "Extract key contract dates",
      slug: "extract-key-contract-dates",
      categoryId: contracts.id,
      description:
        "Given a contract document, extract all operative dates (effective date, expiry, notice periods, renewal windows) and return them in a structured format.",
      prompt:
        `Extract all legally operative dates from the following contract.\n\nReturn a JSON object with these keys (use null if not present):\n{\n  "effective_date": "YYYY-MM-DD",\n  "expiry_date": "YYYY-MM-DD",\n  "notice_period_days": number,\n  "auto_renewal": boolean,\n  "renewal_window_days": number,\n  "other_dates": [{ "label": "string", "date": "YYYY-MM-DD" }]\n}\n\nContract:\n{{CONTRACT}}`,
      expectedOutput:
        `A valid JSON object with all date fields. Dates in YYYY-MM-DD. Notice periods converted to days. Auto-renewal flag correctly inferred from renewal language.`,
      editorScore: 4,
      notes: "Strong on standard MSA and SaaS contracts. Struggles with bespoke clauses that reference dates indirectly (e.g., '30 days after first shipment').",
      publishedAt: new Date(),
    },
  })

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
