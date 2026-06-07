"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface UserMenuProps {
  user: SupabaseUser | null
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!user) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-7 border-zinc-800 bg-transparent text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      >
        <a href="/auth/login">Sign in</a>
      </Button>
    )
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "U"
  const avatarUrl = user.user_metadata?.["avatar_url"] as string | undefined
  const displayName = (user.user_metadata?.["name"] as string | undefined) ?? user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200">
          <Avatar className="h-6 w-6">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block">{displayName}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48 border-zinc-800 bg-zinc-950 text-zinc-300"
      >
        <div className="px-2 py-1.5">
          <p className="truncate font-mono text-xs text-zinc-500">{user.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem asChild className="gap-2 text-sm focus:bg-zinc-900 focus:text-zinc-200">
          <Link href="/profile">
            <User className="h-3.5 w-3.5" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="gap-2 text-sm focus:bg-zinc-900 focus:text-zinc-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
