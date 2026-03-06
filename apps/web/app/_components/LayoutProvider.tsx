"use client"

import { usePathname } from "next/navigation"
import React from "react"

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")

    if (isAuthPage) {
        return <>{children}</>
    }

    return <>{children}</>
}

// Helper to check if we should show nav/footer
export function useShowLayout() {
    const pathname = usePathname()
    return !(pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up"))
}
