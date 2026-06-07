import Link from "next/link"
import { BarChart3, ArrowRight, Users, Pencil, TrendingUp, TrendingDown, CheckCircle2, GraduationCap, Swords, Target, Compass } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"

const SCALE = [
  {
    score: 1,
    label: "Failing",
    desc: "Agent cannot execute autonomously without breaking the build, hallucinating dependencies, or producing output that requires complete manual reconstruction.",
  },
  {
    score: 2,
    label: "Marginal",
    desc: "Agent produces a scaffold autonomously, but contains critical errors or logical gaps that require deep expert correction before integration.",
  },
  {
    score: 3,
    label: "Functional",
    desc: "Agent executes the task autonomously under narrow, explicit conditions. Output requires domain review and moderate editing before production integration.",
  },
  {
    score: 4,
    label: "Proficient",
    desc: "Agent executes the task reliably with minimal human intervention. Output requires only spot-checking and minor cosmetic adjustments.",
  },
  {
    score: 5,
    label: "Production-ready",
    desc: "Agent operates at or above the expert human baseline. Output can be merged with standard review and no manual correction.",
  },
]

const FEATURES = [
  {
    icon: Compass,
    title: "Reproducible Playbook",
    desc: "Browse a catalog of structured developer tasks — code review, DevOps, system design, debugging, refactoring, and the rest of the craft.",
  },
  {
    icon: Pencil,
    title: "Expert Baseline",
    desc: "Domain specialists test and score each prompt against a strict execution rubric, defining what is actually possible.",
  },
  {
    icon: Users,
    title: "Community Verification",
    desc: "Execute the prompts in your own development setup and submit your rating to validate or challenge the baseline.",
  },
  {
    icon: TrendingUp,
    title: "The Delta",
    desc: "Analyze the gap between community experience and editor scores to find hidden regressions or silent model updates.",
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [firstDomain, stats] = await Promise.all([
    prisma.domain.findFirst({ orderBy: { sortOrder: "asc" }, select: { slug: true } }),
    prisma.$transaction([
      prisma.task.count({ where: { publishedAt: { not: null } } }),
      prisma.vote.count(),
      prisma.aiModel.count(),
    ]),
  ])

  const [taskCount, voteCount, modelCount] = stats
  const appHref = firstDomain ? `/${firstDomain.slug}` : "/auth/login"

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BarChart3 className="h-4 w-4 text-zinc-400" />
            <span className="font-semibold tracking-tight">TaskScore.ai</span>
            <span className="font-mono text-xs text-zinc-700">beta</span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="h-7 gap-1.5 text-xs">
                <Link href={appHref}>
                  Open app
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 border-zinc-800 bg-transparent text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                <Link href="/auth/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 py-28 text-center">
        {/* Gradient blob */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-zinc-800/20 blur-3xl" />
        </div>

        <div className="relative space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 font-mono text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Open source · Human-in-the-loop benchmarks
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
            Real benchmarks for{" "}
            <span className="text-zinc-400">developer tasks</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg">
            TaskScore.ai benchmarks autonomous AI agents against specific developer tasks. Find out where current models fail, and export optimized directives and rules directly into your IDE config or agent settings.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2 px-6">
              <Link href={user ? appHref : "/auth/login"}>
                {user ? "See the matrix" : "Sign in and rate a task"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!user && (
              <p className="text-xs text-zinc-700">OAuth authentication via GitHub or Google.</p>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-zinc-800/60 bg-zinc-900/30">
        <div className="mx-auto grid max-w-3xl grid-cols-3 divide-x divide-zinc-800 py-6">
          {[
            { value: taskCount, label: "Tasks evaluated" },
            { value: voteCount, label: "Community votes" },
            { value: modelCount, label: "AI models tracked" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-6">
              <span className="font-mono text-2xl font-bold text-zinc-100">{value}</span>
              <span className="text-center font-mono text-xs uppercase tracking-wider text-zinc-600">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-6 py-24 space-y-12">
        <div className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-600">How it works</p>
          <h2 className="text-2xl font-semibold text-zinc-100">
            Baseline scores vs. developer feedback
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                <Icon className="h-4 w-4 text-zinc-400" />
              </div>
              <h3 className="font-semibold text-zinc-200">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Decoding the Delta */}
      <section className="border-t border-zinc-800/60 bg-zinc-900/10 py-24 px-6">
        <div className="mx-auto max-w-4xl space-y-12">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-600">Understanding the Delta</p>
            <h2 className="text-2xl font-semibold text-zinc-100">
              Exposing the Performance Gap
            </h2>
            <p className="mx-auto max-w-lg text-sm text-zinc-500">
              The Delta (Δ) is calculated as Community Score minus Editor Score, highlighting where real-world use cases diverge from controlled benchmarks.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Positive Delta */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Scenario A</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" /> +1.2
                </span>
              </div>
              <h3 className="font-semibold text-zinc-200">Under-promised Capability</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                A positive delta indicates that community ratings are higher than the editor's baseline. This often flags post-release model improvements, fine-tunes, or prompts that perform better under diverse real-world contexts.
              </p>
            </div>

            {/* Negative Delta */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">Scenario B</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800 bg-amber-950 px-3 py-1 font-mono text-xs font-semibold text-amber-400">
                  <TrendingDown className="h-3.5 w-3.5" /> -1.5
                </span>
              </div>
              <h3 className="font-semibold text-zinc-200">Fragile Implementations</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                A negative delta indicates that community scores are lower than the editor's baseline. This signals that the model is failing or showing inconsistency when subjected to edge cases not covered in the initial test.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beyond the Benchmarks */}
      <section className="border-t border-zinc-800/60 bg-zinc-950 px-6 py-24">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-600">The Evaluation Landscape</p>
            <h2 className="text-2xl font-semibold text-zinc-100">
              Evaluating Real-World Utility
            </h2>
            <p className="mx-auto max-w-xl text-sm text-zinc-500">
              Standard benchmarks and chatbot arenas measure lab capabilities or stylistic preferences. TaskScore.ai measures execution.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Academic */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                  <GraduationCap className="h-4 w-4 text-zinc-500" />
                </div>
                <h3 className="font-semibold text-zinc-200">Academic Tests</h3>
                <p className="font-mono text-[10px] text-zinc-600 uppercase">e.g. MMLU, HumanEval</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Multiple-choice tests and static challenges. Highly susceptible to data contamination as newer models train on the test sets.
                </p>
              </div>
              <div className="border-t border-zinc-900 pt-4">
                <span className="font-mono text-xs text-amber-500/80">Limits: Contamination & Saturation</span>
              </div>
            </div>

            {/* Arenas */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                  <Swords className="h-4 w-4 text-zinc-500" />
                </div>
                <h3 className="font-semibold text-zinc-200">Chatbot Arenas</h3>
                <p className="font-mono text-[10px] text-zinc-600 uppercase">e.g. Blind Preference Elo</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Blind preference matching. Primarily measures stylistic attributes like verbosity, formatting cleanliness, or politeness, rather than execution correctness.
                </p>
              </div>
              <div className="border-t border-zinc-900 pt-4">
                <span className="font-mono text-xs text-amber-500/80">Limits: Style preference bias</span>
              </div>
            </div>

            {/* TaskScore */}
            <div className="flex flex-col justify-between rounded-xl border border-zinc-700 bg-zinc-900/40 p-6 space-y-4 ring-1 ring-zinc-800/80">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900">
                  <Target className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-zinc-100">TaskScore.ai</h3>
                <p className="font-mono text-[10px] text-emerald-500/80 uppercase">Real-world Readiness</p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Standardized task execution evaluation. Graded baseline scores challenged by active developers. No proxy metrics—just an honest look at production readiness.
                </p>
              </div>
              <div className="border-t border-zinc-800 pt-4">
                <span className="font-mono text-xs text-emerald-400">Value: Verified Task Execution</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Readiness Scale */}
      <section className="border-y border-zinc-800/60 bg-zinc-900/20 px-6 py-20">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-600">
              The 1–5 Readiness Scale
            </p>
            <h2 className="text-2xl font-semibold text-zinc-100">Standardized Evaluation Rubric</h2>
          </div>

          <div className="space-y-2">
            {SCALE.map(({ score, label, desc }) => (
              <div
                key={score}
                className="flex items-start gap-4 rounded-lg border border-zinc-800/60 bg-zinc-950 px-5 py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 font-mono text-sm font-bold text-zinc-200">
                  {score}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{label}</p>
                  <p className="text-xs text-zinc-600">{desc}</p>
                </div>
                {score === 5 && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold text-zinc-100 sm:text-3xl">
          Contribute your ratings
        </h2>
        <p className="max-w-md text-zinc-500">
          Every evaluation you submit refines the consensus, making it easier for everyone to choose the right model for the right task.
        </p>
        <Button asChild size="lg" className="gap-2 px-8">
          <Link href={user ? appHref : "/auth/login"}>
            {user ? "See the matrix" : "Sign in and rate a task"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-8 text-center">
        <p className="font-mono text-xs text-zinc-700">
          TaskScore.ai — open source, human tested, community driven
        </p>
      </footer>
    </div>
  )
}
