import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@repo/ui/sonner";
import { PageProgressBar, PageProgressProvider } from "@/components/shared/page-progress";
import { ThemeProvider } from "./_components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
    preload: true,
});

export const viewport: Viewport = {
    themeColor: "#EE4822",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL
            ?? process.env.NEXT_PUBLIC_SITE_URL
            ?? "https://app.beres.io"
    ),
    title: {
        default: "Beres App - Owner Dashboard",
        template: "%s | Beres",
    },
    description: "Command center for Beres business owners",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
            "max-snippet": -1,
            "max-image-preview": "none",
            "max-video-preview": -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body className={`${jakarta.variable} font-sans antialiased bg-background text-foreground relative overflow-x-hidden`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    enableColorScheme
                    disableTransitionOnChange
                >
                    <PageProgressProvider>
                        <PageProgressBar />
                        <main className="min-h-screen w-full bg-background relative z-10 flex flex-col">
                            {children}
                        </main>
                        <Toaster richColors position="top-right" />
                    </PageProgressProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
