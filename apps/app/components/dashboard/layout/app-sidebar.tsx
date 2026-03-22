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
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"

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
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organizations: OrgSwitcherItem[]
  activeOrganizationId?: string | null
  navItems: BusinessNavItem[]
  navBaseItems?: BusinessNavItem[]
  navVerticalItems?: BusinessNavItem[]
  isNavLoading?: boolean
  businessName?: string | null
  businessType?: string | null
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
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const businessTypeLabel = businessType
    ? ({ laundry: "Laundry", fnb: "F&B", retail: "Retail" }[businessType] ?? businessType)
    : null
  const hasGroupedNav = (navBaseItems?.length ?? 0) > 0 || (navVerticalItems?.length ?? 0) > 0
  const baseItems = hasGroupedNav ? navBaseItems ?? [] : navItems
  const verticalItems = hasGroupedNav ? navVerticalItems ?? [] : []

  const renderNavItems = (items: BusinessNavItem[]) =>
    items.map((item) => {
      const isActive =
        pathname === item.path || pathname.startsWith(`${item.path}/`)
      const Icon = ICONS[item.icon] ?? LayoutDashboard
      const submenu = item.submenu ?? []
      const isSubActive = submenu.some(
        (sub) =>
          pathname === sub.path || pathname.startsWith(`${sub.path}/`)
      )

      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            asChild
            isActive={isActive || isSubActive}
            tooltip={item.label}
            className="h-9"
          >
            <Link href={item.path}>
              <Icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.badge ? (
            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
          ) : null}
          {submenu.length > 0 ? (
            <SidebarMenuSub>
              {submenu.map((sub) => {
                const isSubItemActive =
                  pathname === sub.path ||
                  pathname.startsWith(`${sub.path}/`)
                return (
                  <SidebarMenuSubItem key={sub.id}>
                    <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                      <Link href={sub.path}>
                        <span>{sub.label}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
            </SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      )
    })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-0">
        <div className="flex h-14 items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Image src="/logo.svg" alt="Beres logo" width={26} height={26} />
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-foreground">
              {businessName ?? "Beres.io"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground font-normal uppercase tracking-wide">
              {businessTypeLabel ? `${businessTypeLabel} dashboard` : "Owner Dashboard"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
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
                    <div className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Menu Dasar
                    </div>
                  ) : null}
                  {renderNavItems(baseItems)}
                </>
              ) : null}
              {verticalItems.length > 0 ? (
                <>
                  <SidebarSeparator />
                  <div className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {businessTypeLabel ? `Menu ${businessTypeLabel}` : "Menu Vertical"}
                  </div>
                  {renderNavItems(verticalItems)}
                </>
              ) : null}
            </>
          )}
        </SidebarMenu>
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
