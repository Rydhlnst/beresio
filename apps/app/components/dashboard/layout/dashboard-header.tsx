"use client"

import * as React from "react"
import Image from "next/image"
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
import { NotificationDropdown } from "./notification-dropdown"

type DashboardHeaderProps = {
  organizationName?: string | null
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}

function HeaderUserMenu({ user }: DashboardHeaderProps["user"]) {
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
        <Button variant="ghost" className="h-9 gap-2 px-2">
          <Avatar className="h-7 w-7 rounded-md">
            <AvatarImage src={user.avatar ?? ""} alt={user.name} />
            <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-semibold text-foreground sm:inline">
            {user.name.split(" ")[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-lg" align="end" sideOffset={8}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarImage src={user.avatar ?? ""} alt={user.name} />
              <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => push("/settings/billing")}>
            <Sparkles />
            Upgrade ke Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => push("/settings/profile")}>
            <BadgeCheck />
            Akun Saya
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => push("/settings/billing")}>
            <CreditCard />
            Billing
          </DropdownMenuItem>
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

export function DashboardHeader({ organizationName, user }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/logo.svg" alt="Beres logo" width={18} height={18} className="sm:hidden" />
          <span className="hidden font-semibold text-foreground sm:inline">
            {organizationName ?? "Organisasi"}
          </span>
          <span className="hidden text-muted-foreground/40 sm:inline">/</span>
          <span className="hidden font-semibold text-muted-foreground sm:inline">Dashboard</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari atau ketik perintah"
            className="h-9 pl-9"
          />
        </div>
        <NotificationDropdown />
        <HeaderUserMenu user={user} />
      </div>
    </header>
  )
}
