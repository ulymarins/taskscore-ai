import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronRight, ExternalLink } from "lucide-react"
import { prisma } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { ScoreDisplay } from "@/components/task/score-display"
import { DeltaBadge } from "@/components/task/delta-badge"
import { PromptBlock } from "@/components/task/prompt-block"
import { VoteForm } from "@/components/task/vote-form"
import { Separator } from "@/components/ui/separator"
import { MarkdownProse } from "@/components/ui/markdown"
import { parseResources } from "@/lib/parse-resources"

interface TaskPageProps {
  params: Promise<{
    domain: string
    category: string
    task: string
  }>
}

async function getTaskData(domainSlug: string, categorySlug: string, taskSlug: string) {
  return prisma.task.findFirst({
    where: {
      slug: taskSlug,
      publishedAt: { not: null },
      category: {
        slug: categorySlug,
        domain: { slug: domainSlug },
      },
    },
    include: {
      category: {
        include: {
          domain: { select: { name: true, slug: true } },
        },
      },
    },
  })
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { domain: domainSlug, category: categorySlug, task: taskSlug } = await params

  const [task, supabase] = await Promise.all([
    getTaskData(domainSlug, categorySlug, taskSlug),
    createClient(),
  ])

  if (!task) notFound()

  const [voteAggregate, { data: { user } }, models] = await Promise.all([
    prisma.vote.aggregate({
      where: { taskId: task.id },
      _avg: { score: true },
      _count: true,
    }),
    supabase.auth.getUser(),
    prisma.aiModel.findMany({
      orderBy: [{ provider: "asc" }, { name: "asc" }],
      select: { id: true, name: true, provider: true },
    }),
  ])

  const existingVote = user
    ? await prisma.vote.findFirst({
        where: { taskId: task.id, userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { score: true, aiModelId: true },
      })
    : null

  const communityScore = voteAggregate._avg.score
  const voteCount = voteAggregate._count
  const resources = parseResources(task.resources)

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-8 lg:px-10 lg:py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 font-mono text-xs text-zinc-600">
        <Link href={`/${domainSlug}`} className="transition-colors hover:text-zinc-400">
          {task.category.domain.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/${domainSlug}?category=${categorySlug}`}
          className="transition-colors hover:text-zinc-400"
        >
          {task.category.name}
        </Link>
      </nav>

      {/* Title + description */}
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight text-zinc-100">{task.name}</h1>
        <p className="max-w-prose leading-relaxed text-zinc-400">{task.description}</p>
      </header>

      {/* Score panel */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-start justify-between gap-4">
          <ScoreDisplay
            editorScore={task.editorScore}
            communityScore={communityScore}
            voteCount={voteCount}
          />
          <div className="pt-6">
            <DeltaBadge
              editorScore={task.editorScore}
              communityScore={communityScore}
              voteCount={voteCount}
            />
          </div>
        </div>

        {task.notes && (
          <>
            <Separator className="my-4 bg-zinc-800" />
            <p className="text-xs text-zinc-500">
              <span className="mr-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-700">
                Editor note:
              </span>
              {task.notes}
            </p>
          </>
        )}
      </div>

      {/* Rationale */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">
          The Verdict: Why a {task.editorScore}/5?
        </h2>
        {task.rationale ? (
          <MarkdownProse content={task.rationale} />
        ) : (
          <p className="text-sm italic text-zinc-600">Editorial rationale coming soon.</p>
        )}
      </section>

      {/* Use Cases */}
      {task.useCases && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Real-World Use Cases</h2>
          <MarkdownProse content={task.useCases} />
        </section>
      )}

      {/* Verified Prompt */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Verified Prompt
        </h2>
        <PromptBlock prompt={task.prompt} />
      </section>

      {/* Expected Output */}
      <section className="space-y-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Expected Output
        </h2>
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-400 scrollbar-thin">
            {task.expectedOutput}
          </pre>
        </div>
      </section>

      {/* Resources */}
      {resources.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100">Resources</h2>
          <ul className="space-y-2">
            {resources.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-700 transition-colors group-hover:text-zinc-500" />
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vote form */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
        <div>
          <h2 className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            {existingVote ? "Your Rating" : "Rate This Task"}
          </h2>
          {!existingVote && (
            <p className="mt-1 text-xs text-zinc-600">
              Test it yourself, then score it honestly.
            </p>
          )}
        </div>
        <VoteForm
          taskId={task.id}
          models={models}
          isAuthenticated={!!user}
          existingVote={existingVote}
        />
      </section>
    </div>
  )
}

export async function generateMetadata({ params }: TaskPageProps): Promise<Metadata> {
  const { domain, category, task: taskSlug } = await params
  const task = await getTaskData(domain, category, taskSlug)
  return {
    title: task?.name ?? "Not Found",
  }
}
