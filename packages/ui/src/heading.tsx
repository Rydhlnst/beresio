import * as React from "react"
import { cn } from "./lib/utils"

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
    ({ className, as: Component = "h2", ...props }, ref) => {
        const variants = {
            h1: "text-[48px] lg:text-[56px] xl:text-[64px] font-bold leading-[1.1] tracking-tight text-foreground",
            h2: "text-4xl lg:text-5xl font-bold tracking-tight text-foreground",
            h3: "text-3xl font-bold tracking-tight text-foreground",
            h4: "text-xl font-bold tracking-tight text-foreground",
            h5: "text-lg font-bold tracking-tight text-foreground",
            h6: "text-base font-bold tracking-tight text-foreground",
        }

        return (
            <Component
                ref={ref}
                className={cn(variants[Component as keyof typeof variants] || variants.h2, className)}
                {...props}
            />
        )
    }
)
Heading.displayName = "Heading"

export { Heading }
