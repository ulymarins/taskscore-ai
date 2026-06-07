import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { DeltaBadge } from "@/components/task/delta-badge"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      votes: {
        orderBy: { updatedAt: "desc" },
        include: {
          aiModel: { select: { name: true, provider: true } },
          task: {
            select: {
              id: true,
              name: true,
              slug: true,
              editorScore: true,
              category: {
                select: {
                  slug: true,
                  name: true,
                  domain: { select: { slug: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  const displayName =
    (user.user_metadata?.["name"] as string | undefined) ?? user.email ?? "User"
  const avatarUrl = user.user_metadata?.["avatar_url"] as string | undefined
  const initials = displayName.slice(0, 2).toUpperCase()
  const memberSince = dbUser?.createdAt ?? new Date()

  return (
    <div className="mx-auto max-w-2xl space-y-10 p-6">
      {/* User card */}
      <div className="flex items-center gap-5">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-zinc-800 text-lg text-zinc-300">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold text-zinc-100">{displayName}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <p className="font-mono text-xs text-zinc-700">
            Member since{" "}
            {memberSince.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="font-mono text-2xl font-bold text-zinc-100">
            {dbUser?.votes.length ?? 0}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-zinc-600">
            Tasks rated
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="font-mono text-2xl font-bold text-zinc-100">
            {dbUser && dbUser.votes.length > 0
              ? (
                  dbUser.votes.reduce((sum, v) => sum + v.score, 0) /
                  dbUser.votes.length
                ).toFixed(1)
              : "—"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-zinc-600">
            Avg score given
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="font-mono text-2xl font-bold text-zinc-100">
            {new Set(dbUser?.votes.map((v) => v.aiModel.name)).size || "—"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wider text-zinc-600">
            Models tested
          </p>
        </div>
      </div>

      {/* Vote history */}
      <div className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-zinc-600">
          Your Ratings
        </h2>

        {!dbUser || dbUser.votes.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-sm text-zinc-600">No ratings submitted yet.</p>
            <p className="mt-1 text-xs text-zinc-700">
              Browse a domain and rate a task to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
            {dbUser.votes.map((vote) => (
              <Link
                key={vote.id}
                href={`/${vote.task.category.domain.slug}/${vote.task.category.slug}/${vote.task.slug}`}
                className="flex items-center gap-4 bg-zinc-950 px-4 py-3 transition-colors hover:bg-zinc-900"
              >
                {/* Score bubble */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 font-mono text-sm font-bold text-zinc-200">
                  {vote.score}
                </span>

                {/* Task info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {vote.task.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs text-zinc-600">
                      {vote.task.category.domain.name}
                    </span>
                    <ChevronRight className="h-3 w-3 text-zinc-700" />
                    <span className="font-mono text-xs text-zinc-600">
                      {vote.task.category.name}
                    </span>
                    <span className="font-mono text-xs text-zinc-700">·</span>
                    <span className="font-mono text-xs text-zinc-600">
                      {vote.aiModel.name}
                    </span>
                  </div>
                </div>

                {/* Delta vs editor */}
                <DeltaBadge
                  editorScore={vote.task.editorScore}
                  communityScore={vote.score}
                  voteCount={1}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
