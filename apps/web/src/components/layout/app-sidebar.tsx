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
    <Sidebar className="border-r border-zinc-800 bg-zinc-950">
      <SidebarHeader className="border-b border-zinc-800 px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <BarChart3 className="h-4 w-4 text-zinc-400" />
          <span className="font-semibold tracking-tight text-zinc-100">TaskScore.ai</span>
          <span className="ml-auto font-mono text-xs text-zinc-700">beta</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-4 text-xs uppercase tracking-wider text-zinc-600">
            Domains
          </SidebarGroupLabel>

          <SidebarMenu>
            {domains.map((domain) => {
              const isDomainActive = pathname.startsWith(`/${domain.slug}`)

              return (
                <Collapsible key={domain.id} defaultOpen={isDomainActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          "gap-2 text-sm transition-colors hover:bg-zinc-900 hover:text-zinc-100",
                          isDomainActive ? "text-zinc-100" : "text-zinc-400"
                        )}
                      >
                        <ChevronRight className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        <Link href={`/${domain.slug}`} className="flex-1 truncate text-left">
                          {domain.name}
                        </Link>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l border-zinc-800 ml-3">
                        {domain.categories.map((category) => {
                          const isCategoryActive = pathname.includes(
                            `/${domain.slug}/${category.slug}`
                          )
                          return (
                            <SidebarMenuSubItem key={category.id}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  "text-xs transition-colors hover:text-zinc-200",
                                  isCategoryActive ? "text-zinc-300" : "text-zinc-600"
                                )}
                              >
                                <Link href={`/${domain.slug}?category=${category.slug}`}>
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

      <SidebarFooter className="border-t border-zinc-800 px-4 py-3">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-zinc-900 hover:text-zinc-200",
            pathname === "/profile" ? "text-zinc-200" : "text-zinc-500"
          )}
        >
          <UserCircle className="h-4 w-4" />
          Profile
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}
