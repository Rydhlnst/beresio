import * as React from "react"
import { cn } from "./lib/utils"

export const Netflix = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
    ({ className, ...props }, ref) => (
        <svg
            ref={ref}
            viewBox="0 0 551.111 1000"
            className={cn("h-6 w-auto", className)}
            {...props}
        >
            <defs>
                <linearGradient id="netflix-a">
                    <stop offset="0" stopColor="#b1060f" stopOpacity="1" />
                    <stop offset=".625" stopColor="#7b010c" stopOpacity="1" />
                    <stop offset="1" stopColor="#b1060f" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="netflix-b">
                    <stop offset="0" stopColor="#b1060f" stopOpacity="1" />
                    <stop offset=".546" stopColor="#7b010c" stopOpacity="1" />
                    <stop offset="1" stopColor="#e50914" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                    id="netflix-c"
                    x1="78.234"
                    x2="221.663"
                    y1="423.767"
                    y2="365.092"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#b1060f" />
                    <stop offset=".546" stopColor="#7b010c" />
                    <stop offset="1" stopColor="#e50914" />
                </linearGradient>
                <linearGradient
                    id="netflix-d"
                    x1="456.365"
                    x2="309.676"
                    y1="521.56"
                    y2="583.495"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0" stopColor="#b1060f" />
                    <stop offset=".625" stopColor="#7b010c" />
                    <stop offset="1" stopColor="#b1060f" />
                </linearGradient>
            </defs>
            <path
                d="M-1.152-1.152 2.305 1002.67c73.273-14.111 130.892-12.569 195.924-18.44V0Z"
                fill="url(#netflix-c)"
            />
            <path
                d="M353.816 0h199.381l2.305 1000.365-202.839-33.422z"
                fill="url(#netflix-d)"
            />
            <path
                d="M1.152 0c4.61 11.525 345.749 981.925 345.749 981.925 56.056-.4 131.219 8.754 205.144 17.288L197.077 0Z"
                fill="#e50914"
            />
        </svg>
    )
)
Netflix.displayName = "Netflix"
