"use client"

import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { useTransitionRouter } from "@/hooks/use-transition-router"

export type OrgSwitcherItem = {
  id: string
  name: string
  plan?: string | null
  logoUrl?: string | null
}

export function OrgSwitcher({
  organizations,
  activeOrganizationId,
  variant = "dropdown",
}: {
  organizations: OrgSwitcherItem[]
  activeOrganizationId?: string
  variant?: "dropdown" | "list"
}) {
  const { isMobile } = useSidebar()
  const { push, refresh } = useTransitionRouter()
  const [activeOrg, setActiveOrg] = React.useState<OrgSwitcherItem | undefined>(() => {
    return organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0]
  })

  React.useEffect(() => {
    setActiveOrg(organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0])
  }, [activeOrganizationId, organizations])

  if (!activeOrg) return null

  const handleSelect = async (org: OrgSwitcherItem) => {
    if (activeOrg?.id === org.id) return
    setActiveOrg(org)
    const { error } = await (authClient.organization as any).setActiveOrganization({
      organizationId: org.id,
    })

    if (error) {
      toast.error(error.message || "Gagal mengganti organisasi.")
      return
    }

    refresh()
  }

  const renderOrgLogo = (org: OrgSwitcherItem, size = 32) => {
    if (org.logoUrl) {
      return (
        <img
          src={org.logoUrl}
          alt={org.name}
          width={size}
          height={size}
          className="rounded-md object-cover"
        />
      )
    }

    const initials = org.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

    return (
      <div className="flex h-full w-full items-center justify-center rounded-md bg-sidebar-primary/10 text-xs font-semibold text-sidebar-primary">
        {initials}
      </div>
    )
  }

  if (variant === "list") {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Organisasi</SidebarGroupLabel>
        <SidebarGroupAction
          onClick={() => push("/organizations/new")}
          aria-label="Tambah Organisasi"
        >
          <Plus className="size-4" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {organizations.map((org) => {
              const isActive = activeOrg.id === org.id
              return (
                <SidebarMenuItem key={org.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    className="h-9 gap-3"
                    onClick={() => handleSelect(org)}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        isActive ? "bg-primary" : "bg-muted-foreground/40"
                      }`}
                    />
                    <span className="truncate">{org.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const planLabel = activeOrg.plan
    ? `${activeOrg.plan.charAt(0).toUpperCase()}${activeOrg.plan.slice(1)}`
    : "Starter"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                {renderOrgLogo(activeOrg)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrg.name}
                </span>
                <span className="truncate text-xs">{planLabel}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organisasi
            </DropdownMenuLabel>
            {organizations.map((org, index) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelect(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border overflow-hidden">
                  {renderOrgLogo(org, 24)}
                </div>
                {org.name}
                <DropdownMenuShortcut>{`Ctrl+${index + 1}`}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={() => push("/organizations/new")}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="font-normal text-muted-foreground">Tambah Organisasi</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
