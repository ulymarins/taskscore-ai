"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, BarChart3, UserCircle, LayoutDashboard, Layers, Box, Settings } from "lucide-react"
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
      <SidebarHeader className="border-b border-zinc-800/50 px-6 py-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/20 transition-all group-hover:bg-indigo-500/20 group-hover:ring-indigo-500/40">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-zinc-100">TaskScore.ai</span>
            <span className="text-[10px] font-medium tracking-widest text-indigo-400/80 uppercase">beta</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Domains
          </SidebarGroupLabel>

          <SidebarMenu className="space-y-1">
            {domains.map((domain, index) => {
              const isDomainActive = pathname.startsWith(`/${domain.slug}`)
              const Icon = [LayoutDashboard, Layers, Box, Settings][index % 4] || Layers

              return (
                <Collapsible key={domain.id} defaultOpen={isDomainActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          "w-full justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isDomainActive 
                            ? "bg-zinc-800/80 text-zinc-100 shadow-sm ring-1 ring-zinc-700/50" 
                            : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-4 w-4", isDomainActive ? "text-indigo-400" : "text-zinc-500")} />
                          <span className="truncate">{domain.name}</span>
                        </div>
                        <ChevronRight className={cn(
                          "h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200",
                          "group-data-[state=open]/collapsible:rotate-90",
                          isDomainActive && "text-zinc-400"
                        )} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                      <SidebarMenuSub className="mr-0 ml-4 mt-1 space-y-1 border-l-2 border-zinc-800/50 pl-3">
                        {domain.categories.map((category) => {
                          const isCategoryActive = pathname.includes(
                            `/${domain.slug}/${category.slug}`
                          )
                          return (
                            <SidebarMenuSubItem key={category.id} className="relative">
                              {isCategoryActive && (
                                <div className="absolute -left-[13px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-indigo-400 ring-4 ring-zinc-950" />
                              )}
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "rounded-md px-3 py-2 text-xs font-medium transition-all duration-200",
                                  isCategoryActive 
                                    ? "bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20" 
                                    : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
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

      <SidebarFooter className="border-t border-zinc-800/50 p-4">
        <Link
          href="/profile"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/profile" 
              ? "bg-zinc-800/80 text-zinc-100 ring-1 ring-zinc-700/50" 
              : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          )}
        >
          <UserCircle className={cn(
            "h-5 w-5 transition-colors",
            pathname === "/profile" ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"
          )} />
          <span>Profile</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
