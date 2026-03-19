"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"
import { Loader2 } from "lucide-react"

/* ========================================
   MODERN BUTTON COMPONENT
   Pill shapes, soft variants, loading states
   ======================================== */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Filled with subtle shadow
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 rounded-full",

        // Secondary - Soft background
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full",

        // Outline - Bordered with hover fill
        outline:
          "border-2 border-border bg-transparent hover:bg-muted hover:border-border/60 rounded-full",

        // Ghost - Transparent with hover
        ghost:
          "hover:bg-muted hover:text-foreground rounded-full",

        // Soft - Subtle colored background (new)
        soft:
          "bg-primary/10 text-primary hover:bg-primary/15 rounded-full",

        // Soft secondary
        "soft-secondary":
          "bg-muted text-muted-foreground hover:bg-muted/80 rounded-full",

        // Soft success
        "soft-success":
          "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900",

        // Soft warning
        "soft-warning":
          "bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",

        // Soft danger
        "soft-danger":
          "bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-full dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900",

        // Glass - Modern glassmorphism (new)
        glass:
          "bg-white/80 backdrop-blur-sm border border-white/20 text-foreground hover:bg-white/90 rounded-full dark:bg-white/10 dark:hover:bg-white/15 dark:border-white/10",

        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",

        // Link
        link:
          "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
        "icon-xl": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonModernProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const ButtonModern = React.forwardRef<HTMLButtonElement, ButtonModernProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
ButtonModern.displayName = "ButtonModern"

/**
 * Icon Button - Circular button for icons
 */
const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonModernProps, "size"> & {
    size?: "sm" | "default" | "lg" | "xl"
  }
>(({ className, size = "default", ...props }, ref) => {
  const sizeMap = {
    sm: "icon-sm",
    default: "icon",
    lg: "icon-lg",
    xl: "icon-xl",
  }

  return (
    <ButtonModern
      ref={ref}
      size={sizeMap[size] as any}
      className={cn("rounded-full", className)}
      {...props}
    />
  )
})
IconButton.displayName = "IconButton"

/**
 * Button Group - Grouped buttons with connected styling
 */
const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    attached?: boolean
  }
>(({ className, attached = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center",
      attached
        ? "[&>button:first-child]:rounded-r-none [&>button:last-child]:rounded-l-none [&>button:not(:first-child):not(:last-child)]:rounded-none [&>button+button]:-ml-px"
        : "gap-2",
      className
    )}
    {...props}
  />
))
ButtonGroup.displayName = "ButtonGroup"

export { ButtonModern, IconButton, ButtonGroup, buttonVariants }
