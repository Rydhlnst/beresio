import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@repo/ui/sonner";
import { PageProgressBar, PageProgressProvider } from "@/components/shared/page-progress";

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
    title: {
        default: "Beres App — Owner Dashboard",
        template: "%s | Beres",
    },
    description: "Command center for Beres business owners",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body className={`${jakarta.variable} font-sans antialiased bg-background text-foreground relative overflow-x-hidden`}>
                <PageProgressProvider>
                    <PageProgressBar />
                    <main className="min-h-screen w-full bg-background relative z-10 flex flex-col">
                        {children}
                    </main>
                    <Toaster richColors position="top-right" />
                </PageProgressProvider>
            </body>
        </html>
    );
}
