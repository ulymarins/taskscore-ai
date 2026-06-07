import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { UserMenu } from "@/components/layout/user-menu"
import { createClient } from "@/lib/supabase/server"

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-10 flex h-11 items-center gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="h-7 w-7 text-zinc-500 hover:text-zinc-300" />
      <Separator orientation="vertical" className="h-4 bg-zinc-800" />
      <div className="flex-1" />
      <UserMenu user={user} />
    </header>
  )
}
