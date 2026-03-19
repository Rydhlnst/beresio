"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

/* ========================================
   MODERN BADGE COMPONENT
   Pill shapes and soft color variants
   ======================================== */

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Filled variants
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        
        // Soft variants (subtle background)
        soft: "border-transparent bg-primary/10 text-primary",
        "soft-secondary": "border-transparent bg-muted text-muted-foreground",
        "soft-success": "border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        "soft-warning": "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        "soft-danger": "border-transparent bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        "soft-info": "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        
        // Outlined variants
        outline: "text-foreground border-border",
        "outline-primary": "text-primary border-primary/30",
        "outline-success": "text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800",
        "outline-warning": "text-amber-700 border-amber-200 dark:text-amber-300 dark:border-amber-800",
        "outline-danger": "text-rose-700 border-rose-200 dark:text-rose-300 dark:border-rose-800",
        
        // Dot variants (with status dot)
        dot: "border-transparent bg-muted text-muted-foreground pl-2",
      },
      size: {
        default: "h-6 px-2.5",
        sm: "h-5 px-2 text-[10px]",
        lg: "h-7 px-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeModernProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: "success" | "warning" | "danger" | "info" | "neutral"
}

function BadgeModern({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeModernProps) {
  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-gray-400",
  }

  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            dotColors[dot]
          )}
        />
      )}
      {children}
    </div>
  )
}

/**
 * Status Badge - Pre-configured badges for common statuses
 */
interface StatusBadgeProps extends Omit<BadgeModernProps, "variant" | "dot"> {
  status: "success" | "warning" | "danger" | "info" | "neutral" | "pending"
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusMap = {
    success: { variant: "soft-success" as const, dot: "success" as const },
    warning: { variant: "soft-warning" as const, dot: "warning" as const },
    danger: { variant: "soft-danger" as const, dot: "danger" as const },
    info: { variant: "soft-info" as const, dot: "info" as const },
    neutral: { variant: "soft-secondary" as const, dot: "neutral" as const },
    pending: { variant: "soft-warning" as const, dot: "warning" as const },
  }

  const config = statusMap[status]

  return (
    <BadgeModern
      variant={config.variant}
      dot={config.dot}
      className={className}
      {...props}
    />
  )
}

export { BadgeModern, StatusBadge, badgeVariants }
