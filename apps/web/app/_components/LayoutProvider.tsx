"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "./theme-provider"

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    )
}

// Helper to check if we should show nav/footer
export function useShowLayout() {
    const pathname = usePathname()
    return !(pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up"))
}
