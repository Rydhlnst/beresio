"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@repo/ui/button"

export function Banner() {
    return (
        <div className="relative z-[60] flex h-10 w-full items-center justify-center bg-primary text-white hover:bg-primary/95 transition-colors">
            <div className="mx-auto flex w-full max-w-[1400px] items-center justify-center px-4 sm:px-8">
                <Link
                    href="/wishlist"
                    className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium tracking-wide text-center"
                >
                    <span className="truncate sm:whitespace-normal">Beres.io segera hadir! <span className="hidden sm:inline">Jadilah yang pertama tahu & dapatkan akses VIP.</span></span>
                    <Button variant={"link"} className="text-background text-xs">
                        <span>Gabung Wishlist</span>
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
