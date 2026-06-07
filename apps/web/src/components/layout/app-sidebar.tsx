"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, BarChart3, UserCircle } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
}

interface Domain {
  id: string
  name: string
  slug: string
  categories: Category[]
}

interface AppSidebarProps {
  domains: Domain[]
}

export function AppSidebar({ domains }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-zinc-800/50 bg-gradient-to-b from-zinc-950 to-zinc-900/90 backdrop-blur-xl">
      <SidebarHeader className="border-b border-zinc-800/50 px-5 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500/10 ring-1 ring-indigo-500/20 transition-all group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/40">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">TaskScore.ai</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Domains
          </SidebarGroupLabel>

          <SidebarMenu className="space-y-0.5">
            {domains.map((domain) => {
              const isDomainActive = pathname.startsWith(`/${domain.slug}`)

              return (
                <Collapsible key={domain.id} defaultOpen={isDomainActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          "w-full justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isDomainActive
                            ? "bg-zinc-800/80 text-zinc-100 ring-1 ring-zinc-700/50"
                            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                        )}
                      >
                        <span className="truncate">{domain.name}</span>
                        <ChevronRight className={cn(
                          "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200",
                          "group-data-[state=open]/collapsible:rotate-90",
                          isDomainActive && "text-zinc-400"
                        )} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub className="mr-0 ml-3 mt-0.5 space-y-0.5 border-l border-zinc-800/60 pl-2">
                        {domain.categories.map((category) => {
                          const isCategoryActive = pathname.includes(
                            `/${domain.slug}/${category.slug}`
                          )
                          return (
                            <SidebarMenuSubItem key={category.id}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                  isCategoryActive
                                    ? "bg-zinc-800/60 text-zinc-100"
                                    : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300"
                                )}
                              >
                                <Link href={`/${domain.slug}?category=${category.slug}`} className="flex w-full items-center">
                                  {category.name}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-800/50 p-3">
        <Link
          href="/profile"
          className={cn(
            "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/profile"
              ? "bg-zinc-800/80 text-zinc-100 ring-1 ring-zinc-700/50"
              : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          )}
        >
          <UserCircle className={cn(
            "h-4 w-4 transition-colors",
            pathname === "/profile" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"
          )} />
          <span>Profile</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
