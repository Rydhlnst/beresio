"use client"

import * as React from "react"
import { OrgSwitcher, type OrgSwitcherItem } from "@/components/dashboard/layout/org-switcher"
import type { NavIconKey, NavItem } from "@/components/dashboard/layout/nav-config"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@repo/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  BarChart3,
  GitBranch,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Truck,
  Users,
} from "lucide-react"

const ICONS: Record<NavIconKey, React.ElementType> = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  receipt: Receipt,
  "bar-chart-3": BarChart3,
  users: Users,
  "git-branch": GitBranch,
  settings: Settings,
  truck: Truck,
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organizations: OrgSwitcherItem[]
  activeOrganizationId?: string | null
  navItems: NavItem[]
}

export function AppSidebar({
  organizations,
  activeOrganizationId,
  navItems,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center">
          <Image src="/logo.svg" alt="Beres logo" width={26} height={26} />
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-foreground">Beres.io</span>
            <span className="truncate text-[11px] text-muted-foreground font-normal uppercase tracking-wide">
              Owner Dashboard
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-1 gap-1">
          {navItems.map((item) => {
             const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
             const Icon = ICONS[item.iconKey] ?? LayoutDashboard

             return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className="h-9"
                >
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
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
