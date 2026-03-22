import { Skeleton } from "@repo/ui/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuSkeleton,
  SidebarSeparator,
  SidebarInset,
  SidebarProvider,
} from "@repo/ui/sidebar"
import { Input } from "@repo/ui/input"
import { Button } from "@repo/ui/button"
import { Search, Bell, PanelLeft } from "lucide-react"

function DashboardHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-1" disabled>
          <PanelLeft className="size-4 text-muted-foreground" />
        </Button>
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-4 w-24 sm:block" />
          <Skeleton className="hidden h-4 w-4 sm:block" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Cari..." className="h-9 pl-9" disabled />
        </div>
        <Button variant="ghost" size="icon" className="relative" disabled>
          <Bell className="size-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" className="h-9 gap-2 px-2" disabled>
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
        </Button>
      </div>
    </header>
  )
}

function AppSidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-0">
        <div className="flex h-14 items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Skeleton className="size-[26px] shrink-0 rounded-md" />
          <div className="grid flex-1 gap-1.5 text-left group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu className="gap-1">
          <SidebarMenuSkeleton showIcon width="75%" />
          <SidebarMenuSkeleton showIcon width="60%" />
          <SidebarMenuSkeleton showIcon width="80%" />
          <SidebarMenuSkeleton showIcon width="65%" />
          <SidebarMenuSkeleton showIcon width="70%" />
        </SidebarMenu>
        <SidebarSeparator />
        <div className="px-3 py-2">
          <Skeleton className="mb-3 h-3 w-16" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function UpgradeBannerSkeleton() {
  return <div className="h-10 w-full bg-muted/50" />
}

// Default banner height for skeleton (starter plan)
const BANNER_HEIGHT = "40px"

export default function DashboardLoading() {
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ "--banner-height": BANNER_HEIGHT } as React.CSSProperties}
    >
      {/* Banner at the very top */}
      <UpgradeBannerSkeleton />
      
      {/* Main layout with sidebar below banner */}
      <div className="flex-1 flex overflow-hidden">
        <SidebarProvider className="flex w-full">
          <AppSidebarSkeleton />
          <SidebarInset className="flex-1 overflow-hidden bg-background/50">
            <DashboardHeaderSkeleton />
            <main className="overflow-y-auto bg-background" style={{ minHeight: `calc(100vh - ${BANNER_HEIGHT} - 64px)` }}>
              <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] p-4 lg:p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  )
}
