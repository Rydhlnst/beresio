import * as React from "react"
import { cn } from "./lib/utils"

export const Microsoft = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
    ({ className, ...props }, ref) => (
        <svg
            ref={ref}
            viewBox="0 0 256 256"
            preserveAspectRatio="xMidYMid"
            fill="currentColor"
            className={cn("h-6 w-auto", className)}
            {...props}
        >
            <path d="M121.666 121.666H0V0h121.666z" />
            <path d="M256 121.666H134.335V0H256z" />
            <path d="M121.663 256.002H0V134.336h121.663z" />
            <path d="M256 256.002H134.335V134.336H256z" />
        </svg>
    )
)
Microsoft.displayName = "Microsoft"
