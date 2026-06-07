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
            notes: "AI consistently catches direct string interpolation vulnerabilities across Python, JS, PHP, and Ruby.",
            rationale: "Excellent performance. String interpolation checking is highly deterministic, making this one of the most reliable use cases for modern LLMs.",
            useCases: "Automated PR reviews, security pre-commit hooks, code audits."
          },
          {
            name: "Review for race conditions",
            slug: "review-for-race-conditions",
            description: "Analyze concurrent or async code and identify potential race conditions, explaining when the hazard occurs and how to fix it with proper synchronization.",
            prompt: "Review the following concurrent code for race conditions and thread-safety issues.\n\nFor each issue:\n1. Identify the specific lines involved\n2. Describe the exact scenario in which the race occurs\n3. Suggest a fix (mutex, atomic, channel, etc.)\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "Identification of all shared-state hazards, timing-dependent bugs, and unsafe concurrent access patterns with correct synchronization fixes.",
            editorScore: 2,
            notes: "Highly inconsistent. Catches obvious shared-variable mutations but misses subtle async hazards and distributed race conditions almost entirely.",
            rationale: "Poor concurrency tracing. LLMs struggle to evaluate multi-threaded state transitions without a formal verification engine.",
            useCases: "Thread safety code reviews, backend system optimization."
          },
          {
            name: "Check for memory leaks",
            slug: "check-for-memory-leaks",
            description: "Review C++ or Go allocation code and detect missing frees, unclosed file descriptors, or dangling references.",
            prompt: "Analyze this code for potential memory leaks, unclosed streams/handles, or resource leaks. Recommend proper cleanup blocks.\n\nCode:\n```\n{{CODE}}\n```",
            expectedOutput: "Detailed detection of unreleased resources (e.g. unclosed file descriptors, missing delete commands) with equivalent try-finally/defer code fixes.",
            editorScore: 3,
            notes: "Good at basic try-with-resources or defer checks, but misses leaks caused by circular references or custom arena allocators.",
            rationale: "Moderate performance. Static resource closing is easy to check, but heap lifetime analysis requires dynamic profiling tools.",
            useCases: "Static analysis checks, system code review."
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
            notes: "PromQL expressions are often syntactically correct but semantically wrong — thresholds are generic and require human tuning for the specific service.",
            rationale: "Prompt works well for syntax boilerplate, but lacks service context. Alert rules require manual customization of durations and metrics.",
            useCases: "Infrastructure alerts, monitoring configuration."
          },
          {
            name: "GitHub Actions workflow for monorepo",
            slug: "github-actions-monorepo",
            description: "Create an optimized GitHub Actions YAML pipeline that runs build, lint, and test tasks for changed packages inside a Turborepo.",
            prompt: "Write a GitHub Actions YAML workflow that builds and tests a Turborepo monorepo. Optimize it by:\n- Caching pnpm store\n- Caching Turborepo builds\n- Only running tests on modified packages using turbo filter.",
            expectedOutput: "Valid YAML containing caching action hooks for pnpm and turbo, using turbo run build --filter=[changed] to speed up execution.",
            editorScore: 4,
            notes: "Generates clean workflows. Minor syntax updates may be needed for deprecated action versions.",
            rationale: "Monorepo setups are standard in public data. LLMs are highly proficient at stitching together boilerplate GitHub Action configs.",
            useCases: "CI/CD setup, monorepo migrations."
          },
          {
            name: "Docker multi-stage build",
            slug: "docker-multi-stage-build",
            description: "Create an optimized, secure Dockerfile for a Next.js application using multi-stage builds to minimize output image size.",
            prompt: "Create a multi-stage Dockerfile for a Next.js application. Ensure it runs as a non-root user, optimizes node_modules caching, and outputs a minimal image.",
            expectedOutput: "A Dockerfile with separate builder and runner stages, setting PORT, NODE_ENV, copying runner outputs, and switching USER to node.",
            editorScore: 5,
            notes: "Consistently generates secure and tiny docker images following modern container best practices.",
            rationale: "Docker configurations are well-documented. Multi-stage setup is a highly repetitive task that LLMs execute perfectly.",
            useCases: "Application containerization, local deployment scripts."
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
            notes: "Excellent on standard CTE syntax. Minor errors can occur if date boundaries or depth checks are introduced.",
            rationale: "Highly structured query patterns. Reucursive CTE syntax is standard and matches model database templates.",
            useCases: "Org charts, tree structures, nested categories."
          },
          {
            name: "Optimize slow JOIN query",
            slug: "optimize-slow-join-query",
            description: "Analyze a slow query with multiple JOINs and subqueries and rewrite it for maximum speed, adding index recommendations.",
            prompt: "Analyze this query and suggest optimizations:\nSELECT u.name, count(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.created_at > NOW() - INTERVAL '30 days' GROUP BY u.name;\n\nIdentify bottlenecks and write a faster version.",
            expectedOutput: "Suggested index on orders(user_id, created_at) and orders table filtering before grouping, or equivalent performance improvements.",
            editorScore: 3,
            notes: "Good at index identification, but misses schema caveats like table size, skew, or index bloat.",
            rationale: "Static query analysis is good, but performance is dynamic and depends heavily on database statistics.",
            useCases: "DBA support, speed optimizations, slow query reviews."
          },
          {
            name: "JSON column indexing and query",
            slug: "json-column-query",
            description: "Write SQL queries that extract values from nested JSONB structures in PostgreSQL, utilizing GIN indices for speed.",
            prompt: "Write a query to search a table `products` with a JSONB column `metadata` for entries where `metadata -> 'attributes' ->> 'color'` is 'blue'. Write the GIN index creation command too.",
            expectedOutput: "Query using `metadata @>` or `->>` syntax and `CREATE INDEX ... ON products USING gin (...)` command.",
            editorScore: 4,
            notes: "Usually correct with jsonb containment operators, but can confuse path syntax for very deep nested arrays.",
            rationale: "Standard syntax patterns. Postgres JSONB operators are well-indexed in train datasets.",
            useCases: "NoSQL patterns in SQL, schema-less metadata, nested catalog filtering."
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
            editorScore: 4,
            notes: "Strong on nginx and syslog formats, but struggles if custom app log logs are truncated mid-line.",
            rationale: "Regex and string parsing are strengths of semantic LLMs, though context window limit bounds output sizes.",
            useCases: "Ingestion pipeline scripts, security log auditing."
          },
          {
            name: "Handle missing values in Pandas",
            slug: "handle-missing-pandas",
            description: "Write Pandas code to clean dataframes, handling missing data using median values, rolling averages, or specific default markers.",
            prompt: "Write a Python script using Pandas to identify columns with missing values in `df` and impute them: numeric columns with the column median, categorical columns with 'Unknown'.",
            expectedOutput: "Clean Python code using `df.fillna()` or `df.select_dtypes()` to split columns and apply imputation.",
            editorScore: 5,
            notes: "Pandas manipulation is highly accurate. Code is correct and uses modern, vectorized operations instead of slow iteration loops.",
            rationale: "Pandas code is incredibly standard and abundant online. The code generated is fast, idiomatic, and works immediately.",
            useCases: "Jupyter notebooks, ML data pipelines, ingestion scripts."
          },
          {
            name: "Format messy CSV timestamps",
            slug: "format-messy-timestamps",
            description: "Write a script to parse irregular, string-based date formats in a CSV file and convert them all to a clean ISO-8601 standard.",
            prompt: "Write Python code that parses dates in varying formats ('MM/DD/YYYY', 'YYYY-MM-DD HH:MM:SS', 'DD-Mon-YY') and standardizes them to ISO-8601 UTC format.",
            expectedOutput: "Python script using `pd.to_datetime()` with `errors='coerce'` or `dateutil.parser` mapping dates safely.",
            editorScore: 5,
            notes: "Excellent at handling timezone offsets and date strings. The script is robust against invalid formats.",
            rationale: "Datetime library APIs are standard. LLMs are highly proficient at handling formatting tasks.",
            useCases: "CSV imports, ETL processes, dashboard database pre-processing."
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
            notes: "Creates excellent, readable documentation. May need adjustments for internal company nomenclature or custom branding.",
            rationale: "Structured text generation is a core strength. The PRD template is professional and covers all critical security bases.",
            useCases: "Feature kickoffs, engineering handoffs, product planning."
          },
          {
            name: "Create user story mapping",
            slug: "user-story-mapping",
            description: "Break down booking checkout flow into epics and sprint stories.",
            prompt: "Create a user story map for a travel checkout flow (booking hotel). Break it down into Epics (Selection, Cart, Payment, Confirmation) and list individual user stories with acceptance criteria.",
            expectedOutput: "Clean story list organized by epics, with stories in 'As a... I want... So that...' format with Given-When-Then criteria.",
            editorScore: 4,
            notes: "Stories are complete and logical. Gherkin acceptance criteria are well-formatted.",
            rationale: "User journeys are highly patterned. The stories match standard agile templates perfectly.",
            useCases: "Jira ticket creation, sprint refinement, design scoping."
          },
          {
            name: "Define metrics for user search",
            slug: "define-search-metrics",
            description: "Design KPIs and analytics events to measure search bar engagement.",
            prompt: "Define a measurement framework for a new e-commerce search bar. Specify: Core KPIs (conversion, click-through, zero-result rate) and telemetry events (search_triggered, item_clicked).",
            expectedOutput: "A list of 5 KPIs and a structured table of event names with schema fields (search_term, result_count).",
            editorScore: 4,
            notes: "KPI definitions are clean. Event schema is standard and easy to feed into Segment or Mixpanel.",
            rationale: "Measurement frameworks are highly consistent. The list of metrics covers both engagement and business conversion.",
            useCases: "Analytics scoping, product launch preparation, KPI dashboards."
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
            editorScore: 5,
            notes: "Translates developer jargon into plain English exceptionally well.",
            rationale: "Text summarization and tone-shifting are highly mature capabilities for modern language models.",
            useCases: "Release announcements, newsletter updates, customer support sync."
          },
          {
            name: "Draft sprint retro guidelines",
            slug: "sprint-retro-guidelines",
            description: "Write template questions for retrospective focusing on velocity blockages.",
            prompt: "Write a template and facilitator guide for a sprint retrospective. Design it to address team conflict and velocity blockages. Provide exercises for action item generation.",
            expectedOutput: "A structured retro template (e.g. Start/Stop/Continue) along with instructions for the Scrum Master on resolving blocks.",
            editorScore: 5,
            notes: "Provides excellent templates and helpful facilitation prompts for Scrum Masters.",
            rationale: "Organizational meeting structures are highly standardized. The retro prompts are psychologically safe and constructive.",
            useCases: "Sprint ceremonies, agile coaching, manager playbooks."
          },
          {
            name: "Triage backlog bug tickets",
            slug: "backlog-bug-triage",
            description: "Define priority matrix based on user impact and tech feasibility.",
            prompt: "Draft a prioritization matrix to triage 5 incoming bugs. Explain the criteria for assigning Critical, High, Medium, Low severity based on user volume and blockages.",
            expectedOutput: "A clean prioritization rubric with definitions for each severity level and example scenarios.",
            editorScore: 4,
            notes: "Triage criteria are logical. Helps teams establish consistent standards.",
            rationale: "Standard product triage rules are easily replicated. Rubrics are structured and clear.",
            useCases: "QA operations, customer support sync, triage meetings."
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
            editorScore: 4,
            notes: "Highly structured. Outlines are detailed, but require human review to add original research, custom coding examples, or personal opinions.",
            rationale: "Outline generation is highly repeatable. The outline is logical and matches standard SEO content briefs.",
            useCases: "Content calendars, content writing briefs, freelancer specs."
          },
          {
            name: "Draft meta titles and descriptions",
            slug: "meta-titles-descriptions",
            description: "Write 5 high-converting meta options under 160 characters.",
            prompt: "Write 5 meta title and description combinations for a product page selling 'Eco-friendly organic coffee beans'. Keep titles under 60 chars and descriptions under 160 chars.",
            expectedOutput: "A list of 5 options with character counts shown. Titles and descriptions should include CTAs and keywords.",
            editorScore: 5,
            notes: "Consistently outputs compelling, click-worthy meta tags within character limits.",
            rationale: "Short-form copywriting under strict length constraints is a highly optimized capability.",
            useCases: "SEO auditing, landing page optimization, website launches."
          },
          {
            name: "Write schema markup JSON-LD",
            slug: "schema-markup-json",
            description: "Generate valid FAQ schema JSON-LD markup for a product page.",
            prompt: "Write valid JSON-LD schema markup for a product FAQ containing 3 questions: shipping times, return policy, and organic certification.",
            expectedOutput: "Valid JSON-LD schema within script tag with '@context': 'https://schema.org' and '@type': 'FAQPage' mapping the questions and answers.",
            editorScore: 5,
            notes: "Generates valid schema markup that fits Google search requirements perfectly.",
            rationale: "Structured JSON data templates are highly repetitive and syntax checks are robust.",
            useCases: "Technical SEO, product page upgrades, search engine rich snippets."
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
            editorScore: 5,
            notes: "Perfect compliance with character constraints. Ad copy is engaging and optimized.",
            rationale: "Character constraint checking is exact. The headlines use high-intent search terms.",
            useCases: "PPC campaigns, ad copy testing, marketing drafts."
          },
          {
            name: "Draft Facebook Ad hook",
            slug: "facebook-ad-hook",
            description: "Write 3 scroll-stopping copy hooks for B2B SaaS target audience.",
            prompt: "Write 3 different angles for a Facebook ad hook targeting Engineering Managers. SaaS benefit: 'Reduce merge conflict resolution time by 80%'. Angles: Direct, Story-based, Curiosity-based.",
            expectedOutput: "3 hooks of 2-3 sentences each, formatted to attract attention immediately on feed scrolling.",
            editorScore: 4,
            notes: "Strong hooks. Tone is highly relevant to engineering managers, though requires editing to match specific brand style guides.",
            rationale: "Tone matching is a mature feature. The hooks are persuasive and address real-world developer friction points.",
            useCases: "Paid acquisition, social media ads, creative assets."
          },
          {
            name: "Write sponsor newsletter copy",
            slug: "sponsor-newsletter-copy",
            description: "Write short, engaging 150-word newsletter sponsor placement text.",
            prompt: "Write a 150-word sponsored email newsletter section for a developer newsletter. Product: 'Secure DB Client'. Tone: Dev-focused, informal, value-driven. Highlight free tier.",
            expectedOutput: "A 150-word text including subject line placeholder, benefit bullets, and call-to-action link.",
            editorScore: 5,
            notes: "Fits the specified developer tone. Avoids standard corporate speak.",
            rationale: "Tone-matching is a highly optimized aspect of copy generation. The developer focus is authentic and punchy.",
            useCases: "Email marketing, sponsorships, user growth."
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
            editorScore: 4,
            notes: "Excellent on standard SaaS or services agreements. Struggles when dates are conditional or referenced indirectly.",
            rationale: "Extracting entities is a high-accuracy semantic task. Standard contracts are easy to parse.",
            useCases: "Contract lifecycle management, legal operations, contract auditing."
          },
          {
            name: "Identify liability risks in MSA",
            slug: "identify-liability-risks",
            description: "Find standard indemnity/liability clauses that disadvantage a vendor in a Master Services Agreement.",
            prompt: "Review the attached Master Services Agreement. Identify clauses relating to Limitation of Liability, Indemnity, and Intellectual Property that represent high risk for a software service vendor.",
            expectedOutput: "A risk report detailing vulnerable clauses, risk level (Low/Med/High), and recommended negotiation language.",
            editorScore: 3,
            notes: "Good at spotting unilateral clauses, but lacks the commercial judgment of an attorney to negotiate trade-offs.",
            rationale: "Analyzing text for legal concepts is moderate, but balancing commercial risk requires expert legal oversight.",
            useCases: "Pre-review of vendor agreements, risk checklists, legal triage."
          },
          {
            name: "Draft NDA agreement clause",
            slug: "draft-nda-clause",
            description: "Write mutual confidentiality and non-disclosure clause under NY law.",
            prompt: "Draft a mutual confidentiality clause for a business agreement. Ensure it covers definition of Confidential Information, standard exceptions (public info, third party), and survival duration (5 years) under New York law.",
            expectedOutput: "A formal mutual NDA clause in legal terminology with clear exceptions and duration provisions.",
            editorScore: 4,
            notes: "Creates standard mutual NDA sections that follow customary legal draft standards.",
            rationale: "Standard transactional legal language is highly structured. Boilerplate NDA clauses are abundant and accurate.",
            useCases: "Contract drafting, template creation, vendor NDAs."
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
            editorScore: 4,
            notes: "Highly helpful checklist. Catches common database audit violations, though lacks jurisdictional subtlety.",
            rationale: "Database schema rules are structured, making compliance mapping clear and highly accurate.",
            useCases: "GDPR readiness audits, security planning, privacy audits."
          },
          {
            name: "Draft terms of service section",
            slug: "draft-terms-section",
            description: "Write terms of service clause covering user generated content.",
            prompt: "Draft a Terms of Service clause for a SaaS app. The clause must cover: User Generated Content (UGC), user licensing grant to the app, prohibited content, and indemnity for copyright violation.",
            expectedOutput: "A formal terms section detailing UGC ownership, prohibited conduct list, and copyright violation terms.",
            editorScore: 4,
            notes: "Generates clear, standard user-licensing and copyright indemnity clauses.",
            rationale: "Standard transactional terms are highly patterned. The drafted section is comprehensive and legally clean.",
            useCases: "ToS updates, app launches, compliance planning."
          },
          {
            name: "Verify trademark filing requirements",
            slug: "verify-trademark-filing",
            description: "Outline steps and checklist for filing a US trademark application.",
            prompt: "Provide a detailed step-by-step checklist for filing a trademark application with the USPTO. Include: requirements, classifications, and search guidelines.",
            expectedOutput: "An actionable USPTO filing checklist detailing trademark search, classes selection, application submission steps.",
            editorScore: 4,
            notes: "Correctly outlines USPTO registration processes. Clear, structured instructions.",
            rationale: "Government filing guidelines are static and public. The checklist is accurate and easy to follow.",
            useCases: "Startup onboarding, IP planning, brand protection."
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
