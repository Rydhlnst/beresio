import { Wifi } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

interface BrowserMockupProps {
    children: React.ReactNode
    url?: string
    className?: string
    innerClassName?: string
}

export function BrowserMockup({
    children,
    url = "app.beres.cloud",
    className,
    innerClassName
}: BrowserMockupProps) {
    return (
        <div className={cn(
            "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-muted/30",
            className
        )}>
            {/* Browser bar */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
                <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/70" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                    <div className="h-3 w-3 rounded-full bg-brand/70" />
                </div>
                <div className="flex h-6 min-w-0 flex-1 items-center gap-2 rounded-md border border-border/60 bg-background px-3">
                    <Wifi className="h-3 w-3 text-muted-foreground/60" />
                    <span className="truncate text-[11px] text-muted-foreground">{url}</span>
                </div>
            </div>

            {/* Content area */}
            <div className={cn("relative bg-background", innerClassName)}>
                {children}
            </div>
        </div>
    )
}

