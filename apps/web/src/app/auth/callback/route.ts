import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
  }

  // Upsert the user into our public users table so votes can FK to them.
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {
      email: data.user.email!,
      name: (data.user.user_metadata?.["name"] as string | undefined) ?? null,
      avatarUrl: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
    },
    create: {
      id: data.user.id,
      email: data.user.email!,
      name: (data.user.user_metadata?.["name"] as string | undefined) ?? null,
      avatarUrl: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
    },
  })

  // After login, send to the first domain if no explicit next param
  if (next === "/") {
    const firstDomain = await prisma.domain.findFirst({
      orderBy: { sortOrder: "asc" },
      select: { slug: true },
    })
    if (firstDomain) {
      return NextResponse.redirect(`${origin}/${firstDomain.slug}`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
