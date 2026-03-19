"use client"

import * as React from "react"
import { cn } from "./lib/utils"
import { CardModern, CardModernContent } from "./card-modern"

/* ========================================
   DASHBOARD SECTION CARD
   For dashboard content sections with header
   ======================================== */

interface DashboardSectionCardProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  headerClassName?: string
  variant?: "default" | "elevated" | "gradient"
  hover?: boolean
}

function DashboardSectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
  variant = "default",
  hover = true,
}: DashboardSectionCardProps) {
  return (
    <CardModern
      variant={variant}
      hover={hover}
      hoverScale={hover}
      className={cn("flex flex-col", className)}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-5 border-b border-border/40",
          headerClassName
        )}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
      <CardModernContent className={cn("flex-1", contentClassName)}>
        {children}
      </CardModernContent>
    </CardModern>
  )
}

/**
 * Compact Section Card - Smaller padding for dense layouts
 */
interface CompactSectionCardProps extends Omit<DashboardSectionCardProps, "children"> {
  children: React.ReactNode
  icon?: React.ReactNode
}

function CompactSectionCard({
  title,
  description,
  icon,
  actions,
  children,
  className,
  ...props
}: CompactSectionCardProps) {
  return (
    <CardModern
      variant="default"
      hover
      className={cn("flex flex-col", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10 flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      <div className="px-5 pb-5 flex-1">{children}</div>
    </CardModern>
  )
}

/**
 * Metric Card - Simple metric display
 */
interface MetricCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  className?: string
}

function MetricCard({ label, value, icon, trend, className }: MetricCardProps) {
  return (
    <CardModern hover hoverScale className={cn("relative overflow-hidden", className)}>
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
      <CardModernContent className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
            {trend && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
              {icon}
            </div>
          )}
        </div>
      </CardModernContent>
    </CardModern>
  )
}

/**
 * Action Card - Card with prominent action
 */
interface ActionCardProps {
  title: string
  description?: string
  action: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "ghost"
  }
  icon?: React.ReactNode
  className?: string
}

function ActionCard({ title, description, action, icon, className }: ActionCardProps) {
  return (
    <CardModern
      variant="gradient"
      className={cn("flex flex-col", className)}
    >
      <CardModernContent className="flex flex-col h-full">
        <div className="flex items-start gap-3 mb-4">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="mt-auto">
          <button
            onClick={action.onClick}
            className={cn(
              "w-full h-9 px-4 text-xs font-medium rounded-full transition-all duration-200",
              action.variant === "outline" && "border-2 border-primary/30 text-primary hover:bg-primary/10",
              action.variant === "ghost" && "text-primary hover:bg-primary/10",
              (!action.variant || action.variant === "default") && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {action.label}
          </button>
        </div>
      </CardModernContent>
    </CardModern>
  )
}

export {
  DashboardSectionCard,
  CompactSectionCard,
  MetricCard,
  ActionCard,
}
export type {
  DashboardSectionCardProps,
  CompactSectionCardProps,
  MetricCardProps,
  ActionCardProps,
}
