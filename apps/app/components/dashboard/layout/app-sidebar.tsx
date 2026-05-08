"use client"

import * as React from "react"
import { OrgSwitcher, type OrgSwitcherItem } from "@/components/dashboard/layout/org-switcher"
import type { BusinessNavItem } from "@/components/dashboard/layout/nav-config"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@repo/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  ShoppingBasket,
  ScanLine,
  Box,
  Users,
  BarChart3,
  LayoutGrid,
  CreditCard,
  BookOpen,
  List,
  Plus,
  HeartHandshake,
  Tags,
  Building,
  Shield,
  Settings,
  Truck,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getNavPathMatchScore, isNavPathActive, resolveNavPath } from "@/components/dashboard/layout/nav-utils"
import { OnboardingChecklistWidget, type DashboardOnboardingState } from "@/components/dashboard/onboarding/onboarding-dashboard-client"

const ICONS: Record<string, React.ElementType> = {
  basket: ShoppingBasket,
  scan: ScanLine,
  box: Box,
  users: Users,
  chart: BarChart3,
  grid: LayoutGrid,
  "credit-card": CreditCard,
  "book-open": BookOpen,
  list: List,
  plus: Plus,
  "heart-handshake": HeartHandshake,
  tags: Tags,
  building: Building,
  shield: Shield,
  settings: Settings,
  truck: Truck,
  "layout-dashboard": LayoutDashboard,
}
const MAX_PREFETCH_CACHE = 6

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organizations: OrgSwitcherItem[]
  activeOrganizationId?: string | null
  navItems: BusinessNavItem[]
  navBaseItems?: BusinessNavItem[]
  navVerticalItems?: BusinessNavItem[]
  isNavLoading?: boolean
  businessName?: string | null
  businessType?: string | null
  onboarding?: DashboardOnboardingState | null
}

export function AppSidebar({
  organizations,
  activeOrganizationId,
  navItems,
  navBaseItems,
  navVerticalItems,
  isNavLoading = false,
  businessName,
  businessType,
  onboarding,
  className,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const businessTypeLabel = businessType
    ? ({ laundry: "Laundry", fnb: "F&B", retail: "Retail" }[businessType] ?? businessType)
    : null
  const hasGroupedNav = (navBaseItems?.length ?? 0) > 0 || (navVerticalItems?.length ?? 0) > 0
  const baseItems = hasGroupedNav ? navBaseItems ?? [] : navItems
  const verticalItems = hasGroupedNav ? navVerticalItems ?? [] : []

  const isPathActive = React.useCallback(
    (path: string) => isNavPathActive(pathname, path),
    [pathname]
  )

  // Track expanded menu items
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    // Auto-expand items that have active submenu
    const initial = new Set<string>()
    const allItems = [...baseItems, ...verticalItems]
    allItems.forEach((item) => {
      if (item.submenu?.some((sub) => isPathActive(sub.path))) {
        initial.add(item.id)
      }
    })
    return initial
  })

  React.useEffect(() => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      const allItems = [...baseItems, ...verticalItems]
      allItems.forEach((item) => {
        if (item.submenu?.some((sub) => isPathActive(sub.path))) {
          next.add(item.id)
        }
      })
      return next
    })
  }, [baseItems, verticalItems, isPathActive])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const prefetchedPaths = React.useRef<Set<string>>(new Set())

  const prefetchPath = React.useCallback(
    (path: string) => {
      if (isPathActive(path)) return
      if (!path.startsWith("/") || prefetchedPaths.current.has(path)) return
      if (prefetchedPaths.current.size >= MAX_PREFETCH_CACHE) return
      prefetchedPaths.current.add(path)
      try {
        router.prefetch(path)
      } catch {
        prefetchedPaths.current.delete(path)
      }
    },
    [router, isPathActive]
  )

  const renderNavItems = (items: BusinessNavItem[]) =>
    items.map((item) => {
      const resolvedItemPath = resolveNavPath(item.path)
      const isActive = isPathActive(item.path)
      const Icon = ICONS[item.icon] ?? LayoutDashboard
      const submenu = item.submenu ?? []
      const hasSubmenu = submenu.length > 0
      const activeSubmenuId = submenu.reduce<{ id: string | null; score: number }>(
        (best, sub) => {
          const score = getNavPathMatchScore(pathname, sub.path)
          if (score > best.score) return { id: sub.id, score }
          return best
        },
        { id: null, score: -1 }
      ).id
      const isSubActive = activeSubmenuId !== null
      const isExpanded = expandedItems.has(item.id)

      // Menu item dengan submenu (collapsible)
      if (hasSubmenu) {
        return (
          <Collapsible
            key={item.id}
            open={isExpanded}
            onOpenChange={() => toggleExpanded(item.id)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  isActive={isActive || isSubActive}
                  tooltip={item.label}
                  className="h-10 w-full justify-between rounded-xl px-3 text-[13px] font-medium data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent/70"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.badge ? (
                <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
              ) : null}
              <CollapsibleContent>
                <SidebarMenuSub className="mx-4 border-l border-sidebar-border/70">
                  {submenu.map((sub) => {
                    const resolvedSubPath = resolveNavPath(sub.path)
                    const isSubItemActive = sub.id === activeSubmenuId
                    return (
                      <SidebarMenuSubItem key={sub.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isSubItemActive}
                          className="h-8 rounded-lg text-xs data-[active=true]:bg-sidebar-accent/80 data-[active=true]:font-semibold"
                        >
                          <Link
                            href={resolvedSubPath}
                            prefetch={false}
                            onMouseEnter={() => prefetchPath(resolvedSubPath)}
                            onFocus={() => prefetchPath(resolvedSubPath)}
                          >
                            <span>{sub.label}</span>
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
      }

      // Menu item tanpa submenu (biasa)
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={item.label}
            className="h-10 rounded-xl px-3 text-[13px] font-medium data-[active=true]:bg-primary data-[active=true]:text-primary-foreground hover:bg-sidebar-accent/70"
          >
            <Link
              href={resolvedItemPath}
              prefetch={false}
              onMouseEnter={() => prefetchPath(resolvedItemPath)}
              onFocus={() => prefetchPath(resolvedItemPath)}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.badge ? (
            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
          ) : null}
        </SidebarMenuItem>
      )
    })

  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r border-sidebar-border/70 bg-sidebar/95 backdrop-blur", className)}
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border/70 p-0">
        <div className="flex h-16 items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Image src="/logo.svg" alt="Beres logo" width={26} height={26} />
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[15px] font-semibold text-foreground">
              {businessName ?? "Beres.io"}
            </span>
            <span className="truncate text-[10px] text-muted-foreground font-semibold uppercase tracking-[0.18em]">
              {businessTypeLabel ? `${businessTypeLabel} dashboard` : "Owner Dashboard"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarMenu className="gap-1">
          {isNavLoading ? (
            <>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
            </>
          ) : baseItems.length === 0 && verticalItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Tidak ada menu yang bisa diakses.
            </div>
          ) : (
            <>
              {baseItems.length > 0 ? (
                <>
                  {hasGroupedNav ? (
                    <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Menu Dasar
                    </div>
                  ) : null}
                  {renderNavItems(baseItems)}
                </>
              ) : null}
              {verticalItems.length > 0 ? (
                <>
                  <SidebarSeparator />
                  <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {businessTypeLabel ? `Menu ${businessTypeLabel}` : "Menu Vertical"}
                  </div>
                  {renderNavItems(verticalItems)}
                </>
              ) : null}
            </>
          )}
        </SidebarMenu>
        <SidebarSeparator />
        <OnboardingChecklistWidget state={onboarding ?? null} />
        <SidebarSeparator />
        <OrgSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId ?? undefined}
          variant="list"
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
