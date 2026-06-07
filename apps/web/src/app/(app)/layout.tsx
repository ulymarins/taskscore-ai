import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { prisma } from "@/lib/db"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const domains = await prisma.domain.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return (
    <SidebarProvider>
      <AppSidebar domains={domains} />
      <SidebarInset className="flex min-h-screen flex-col bg-zinc-950">
        <Header />
        <main className="flex-1 overflow-auto scrollbar-thin">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
