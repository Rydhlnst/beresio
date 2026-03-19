"use client"

import * as React from "react"
import { cn } from "./lib/utils"

/* ========================================
   MODERN CARD COMPONENTS
   Enhanced with curves, depth, and polish
   ======================================== */

/**
 * Modern Card - Enhanced with better curves and hover effects
 */
const CardModern = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outline" | "ghost" | "gradient"
    hover?: boolean
    hoverScale?: boolean
  }
>(({ className, variant = "default", hover = false, hoverScale = false, ...props }, ref) => {
  const variants = {
    default: "bg-card text-card-foreground border-border/60",
    elevated: "bg-card-elevated text-card-foreground shadow-lg shadow-black/5 border-border/40",
    outline: "border-2 bg-transparent",
    ghost: "bg-transparent border-transparent",
    gradient: "bg-gradient-to-br from-primary/5 to-card border-primary/10",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        variants[variant],
        hover && "hover:shadow-lg hover:shadow-black/5 hover:border-border/80",
        hoverScale && "hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
})
CardModern.displayName = "CardModern"

/**
 * Card Header - Consistent spacing for card headers
 */
const CardModernHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean
  }
>(({ className, divider = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      divider && "border-b border-border/40",
      className
    )}
    {...props}
  />
))
CardModernHeader.displayName = "CardModernHeader"

/**
 * Card Title - Larger, bolder title
 */
const CardModernTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardModernTitle.displayName = "CardModernTitle"

/**
 * Card Description - Muted description text
 */
const CardModernDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardModernDescription.displayName = "CardModernDescription"

/**
 * Card Content - Consistent padding
 */
const CardModernContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardModernContent.displayName = "CardModernContent"

/**
 * Card Footer - Actions area
 */
const CardModernFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    divider?: boolean
  }
>(({ className, divider = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6",
      divider && "border-t border-border/40",
      className
    )}
    {...props}
  />
))
CardModernFooter.displayName = "CardModernFooter"

/**
 * Card with Gradient Border - Premium effect
 */
const CardGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: "primary" | "success" | "warning" | "info"
  }
>(({ className, gradient = "primary", children, ...props }, ref) => {
  const gradients = {
    primary: "from-primary/30 via-border to-primary/30",
    success: "from-emerald-400/30 via-border to-emerald-400/30",
    warning: "from-amber-400/30 via-border to-amber-400/30",
    info: "from-blue-400/30 via-border to-blue-400/30",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-[1px] bg-gradient-to-br",
        gradients[gradient],
        className
      )}
      {...props}
    >
      <div className="relative rounded-2xl bg-card p-6 h-full">
        {children}
      </div>
    </div>
  )
})
CardGradientBorder.displayName = "CardGradientBorder"

/**
 * Stat Card - For KPI displays
 */
interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  variant?: "default" | "gradient"
  className?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, variant = "default", className }, ref) => {
    return (
      <CardModern
        ref={ref}
        variant={variant === "gradient" ? "gradient" : "default"}
        hover
        hoverScale
        className={cn("relative overflow-hidden", className)}
      >
        {/* Background decoration */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        
        <CardModernContent className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              {trend && (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      trend.isPositive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                {icon}
              </div>
            )}
          </div>
        </CardModernContent>
      </CardModern>
    )
  }
)
StatCard.displayName = "StatCard"

export {
  CardModern,
  CardModernHeader,
  CardModernTitle,
  CardModernDescription,
  CardModernContent,
  CardModernFooter,
  CardGradientBorder,
  StatCard,
}
