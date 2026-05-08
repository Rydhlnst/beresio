"use client"

import React from "react"
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
