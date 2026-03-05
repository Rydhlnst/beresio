import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./lib/utils"

const textVariants = cva(
    "text-foreground",
    {
        variants: {
            variant: {
                default: "text-base leading-normal",
                lead: "text-lg md:text-xl text-muted-foreground leading-relaxed",
                muted: "text-sm text-muted-foreground leading-relaxed",
                overline: "text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary",
                small: "text-xs font-medium leading-none",
                large: "text-lg font-semibold",
                detail: "text-[11px] font-bold text-foreground/70 tracking-tight",
            },
            align: {
                left: "text-left",
                center: "text-center",
                right: "text-right",
            },
            weight: {
                default: "",
                medium: "font-medium",
                semibold: "font-semibold",
                bold: "font-bold",
                extrabold: "font-extrabold",
            }
        },
        defaultVariants: {
            variant: "default",
            align: "left",
            weight: "default"
        },
    }
)

export interface TextProps
    extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
    as?: "p" | "span" | "div"
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
    ({ className, variant, align, as = "p", weight, ...props }, ref) => {
        const Comp = as
        return (
            <Comp
                className={cn(textVariants({ variant, align, weight, className }))}
                ref={ref as any}
                {...props}
            />
        )
    }
)
Text.displayName = "Text"

export { Text, textVariants }
