import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { GitHubIcon, GoogleIcon } from "@/components/icons/brand-icons"

export const metadata = { title: "Sign in" }

async function signInWithGitHub() {
  "use server"
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (data.url) redirect(data.url)
}

async function signInWithGoogle() {
  "use server"
  const supabase = await createClient()
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (data.url) redirect(data.url)
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect("/")

  const { error } = await searchParams

  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">Sign in</h1>
          <p className="text-sm text-zinc-500">
            to submit your AI readiness scores
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-400">
            Authentication failed. Please try again.
          </div>
        )}

        {/* OAuth buttons */}
        <div className="space-y-3">
          <form action={signInWithGitHub}>
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2 border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <GitHubIcon className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </form>

          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2 border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-700">
          Signing in lets you vote. Your email is never shared.
        </p>
      </div>
    </div>
  )
}
