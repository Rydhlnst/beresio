"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Moon,
  Search,
  Sparkles,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { SidebarTrigger } from "@repo/ui/sidebar"
import { Input } from "@repo/ui/input"
import { Button } from "@repo/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { useTransitionRouter } from "@/hooks/use-transition-router"
import type { BusinessNavItem } from "./nav-config"
import { getActiveNavCrumb } from "./nav-utils"

const NotificationDropdown = dynamic(
  () => import("./notification-dropdown").then((mod) => mod.NotificationDropdown),
  {
    loading: () => (
      <Button variant="ghost" size="icon" className="relative h-9 w-9">
        <Bell className="h-4 w-4 text-muted-foreground" />
      </Button>
    ),
  }
)

type DashboardHeaderProps = {
  organizationName?: string | null
  roleName?: string | null
  navItems?: BusinessNavItem[]
  navBaseItems?: BusinessNavItem[]
  navVerticalItems?: BusinessNavItem[]
  permissions?: string[]
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}

function HeaderUserMenu({
  user,
  canManageSettings,
}: {
  user: DashboardHeaderProps["user"]
  canManageSettings: boolean
}) {
  const { push } = useTransitionRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark")
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const handleSignOut = async () => {
    await authClient.signOut()
    push("/login")
  }

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 rounded-full border border-border/70 bg-background/85 px-2.5 hover:bg-secondary/70"
        >
          <Avatar className="h-7 w-7 rounded-full">
            <AvatarImage src={user.avatar ?? ""} alt={user.name} />
            <AvatarFallback className="rounded-full text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-semibold text-foreground sm:inline">
            {user.name.split(" ")[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-xl border-border/70" align="end" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={user.avatar ?? ""} alt={user.name} />
              <AvatarFallback className="rounded-full text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canManageSettings ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => push("/settings/billing")}>
                <Sparkles />
                Upgrade ke Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => push("/settings/profile")}>
            <BadgeCheck />
            Akun Saya
          </DropdownMenuItem>
          {canManageSettings ? (
            <DropdownMenuItem onClick={() => push("/settings/billing")}>
              <CreditCard />
              Billing
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => push("/settings/notifications")}>
            <Bell />
            Notifikasi
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleToggleTheme} className="justify-between">
          <span className="flex items-center gap-2">
            {isDark ? <Moon /> : <Sun />}
            Mode Gelap
          </span>
          <span className="text-xs text-muted-foreground">
            {isDark ? "On" : "Off"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardHeader({
  organizationName,
  roleName,
  navItems,
  navBaseItems,
  navVerticalItems,
  permissions,
  user,
}: DashboardHeaderProps) {
  const pathname = usePathname()

  const combinedNavItems = React.useMemo(() => {
    const hasGroupedNav = (navBaseItems?.length ?? 0) > 0 || (navVerticalItems?.length ?? 0) > 0
    if (hasGroupedNav) return [...(navBaseItems ?? []), ...(navVerticalItems ?? [])]
    return navItems ?? []
  }, [navBaseItems, navVerticalItems, navItems])

  const crumb = React.useMemo(
    () => getActiveNavCrumb(pathname, combinedNavItems),
    [pathname, combinedNavItems]
  )

  const canManageSettings = React.useMemo(() => {
    const perms = permissions ?? []
    return perms.includes("settings.manage") || perms.includes("billing.manage")
  }, [permissions])

  const pageLabel = crumb
    ? crumb.parentLabel
      ? `${crumb.parentLabel} / ${crumb.label}`
      : crumb.label
    : "Dashboard"

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-border/70 bg-background/85 px-3 sm:gap-3 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 shrink-0 rounded-full border border-border/70 bg-background/80 hover:bg-secondary/70" />
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Image src="/logo.svg" alt="Beres logo" width={18} height={18} className="sm:hidden" />
          <span className="hidden max-w-32 truncate whitespace-nowrap font-semibold text-foreground sm:inline lg:max-w-40">
            {organizationName ?? "Organisasi"}
          </span>
          {roleName ? (
            <span className="hidden shrink-0 whitespace-nowrap rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:inline">
              {roleName}
            </span>
          ) : null}
          <span className="hidden shrink-0 text-muted-foreground/40 sm:inline">/</span>
          <span
            className="hidden min-w-0 truncate whitespace-nowrap font-semibold text-primary/80 sm:inline"
            title={pageLabel}
          >
            {pageLabel}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="relative hidden min-w-[8.5rem] flex-1 basis-[13rem] sm:block sm:max-w-[clamp(10rem,30vw,24rem)]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/80" />
          <Input
            placeholder="Cari atau ketik perintah"
            className="h-10 rounded-full border-border/70 bg-background/85 pl-9 focus-visible:ring-primary/40"
          />
        </div>
        <div className="shrink-0">
          <NotificationDropdown />
        </div>
        <div className="shrink-0">
          <HeaderUserMenu user={user} canManageSettings={canManageSettings} />
        </div>
      </div>
    </header>
  )
}
