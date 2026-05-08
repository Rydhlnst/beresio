import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@repo/ui/button"
import { cn } from "@repo/ui/lib/utils"
import { APP_CONTENT_WIDTH } from "./layout-width"

export function Banner() {
    return (
        <div className="relative z-[60] flex h-10 w-full items-center justify-center bg-brand text-white hover:bg-brand/95 transition-colors">
            <div className={cn(APP_CONTENT_WIDTH, "flex items-center justify-center")}>
                <Link
                    href="/sales"
                    className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium tracking-wide text-center"
                >
                    <span className="truncate sm:whitespace-normal">Perlu aktivasi billing/payment? <span className="hidden sm:inline">Konsultasi langsung dengan tim onboarding Beres Cloud.</span></span>
                    <Button variant={"link"} className="text-background text-xs">
                        <span>Hubungi Tim</span>
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}

