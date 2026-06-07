import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { DataTable } from "@/components/matrix/data-table"
import { type TaskRow } from "@/types"
import { cn } from "@/lib/utils"

interface DomainPageProps {
  params: Promise<{ domain: string }>
  searchParams: Promise<{ category?: string }>
}

async function getDomainData(slug: string) {
  return prisma.domain.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: {
          tasks: {
            where: { publishedAt: { not: null } },
            orderBy: { name: "asc" },
            select: {
              id: true,
              slug: true,
              name: true,
              editorScore: true,
              _count: { select: { votes: true } },
            },
          },
        },
      },
    },
  })
}

export default async function DomainPage({ params, searchParams }: DomainPageProps) {
  const [{ domain: domainSlug }, { category: categorySlug }] = await Promise.all([
    params,
    searchParams,
  ])

  const domain = await getDomainData(domainSlug)
  if (!domain) notFound()

  const taskIds = domain.categories.flatMap((c) => c.tasks.map((t) => t.id))

  const voteAverages = await prisma.vote.groupBy({
    by: ["taskId"],
    where: { taskId: { in: taskIds } },
    _avg: { score: true },
  })

  const avgMap = new Map(voteAverages.map((v) => [v.taskId, v._avg.score]))

  const allRows: TaskRow[] = domain.categories.flatMap((category) =>
    category.tasks.map((task) => ({
      id: task.id,
      slug: task.slug,
      name: task.name,
      domainSlug: domain.slug,
      category: category.name,
      categorySlug: category.slug,
      editorScore: task.editorScore,
      communityScore: avgMap.get(task.id) ?? null,
      voteCount: task._count.votes,
    }))
  )

  const rows = categorySlug
    ? allRows.filter((r) => r.categorySlug === categorySlug)
    : allRows

  const activeCategory = categorySlug
    ? domain.categories.find((c) => c.slug === categorySlug)
    : null

  return (
    <div className="p-6 space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-100">{domain.name}</h1>
        {domain.description && (
          <p className="text-sm text-zinc-500">{domain.description}</p>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${domainSlug}`}
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
            !categorySlug
              ? "border-zinc-600 bg-zinc-800 text-zinc-200"
              : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
          )}
        >
          All
        </Link>
        {domain.categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${domainSlug}?category=${cat.slug}`}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
              categorySlug === cat.slug
                ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <DataTable data={rows} domainSlug={domainSlug} />

      <p className="font-mono text-xs text-zinc-700">
        {rows.length} of {allRows.length} task{allRows.length !== 1 ? "s" : ""}
        {activeCategory ? ` in ${activeCategory.name}` : " across all categories"}
      </p>
    </div>
  )
}

export async function generateMetadata({ params }: DomainPageProps): Promise<Metadata> {
  const { domain: slug } = await params
  const domain = await prisma.domain.findUnique({
    where: { slug },
    select: { name: true },
  })
  return {
    title: domain?.name ?? "Not Found",
  }
}
