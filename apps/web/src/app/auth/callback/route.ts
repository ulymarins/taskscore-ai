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

  // User sync is handled by the handle_auth_user_change DB trigger on auth.users.
  // No application-level upsert needed here.

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
