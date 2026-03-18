import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { Toaster } from "@repo/ui";
import { LayoutProvider } from "./_components/LayoutProvider";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
    preload: true,
});

// ── Viewport (pisah dari metadata sesuai Next.js 14+ best practice) ──────────
export const viewport: Viewport = {
    themeColor: "#EE4822",
    width: "device-width",
    initialScale: 1,
};

// ── Metadata utama ─────────────────────────────────────────────────────────────
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.io";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Beres.io — Solusi Bisnis Digital Terpadu untuk UMKM",
        template: "%s | Beres.io",
    },
    description:
        "Beres.io menghadirkan kasir digital (POS), manajemen inventori, laporan keuangan, dan manajemen pengiriman dalam satu platform cloud untuk UMKM Indonesia. Coba gratis 14 hari.",
    keywords: [
        "kasir digital", "POS UMKM", "manajemen inventori",
        "laporan keuangan usaha", "software kasir Indonesia",
        "ERP UMKM", "multi cabang", "beres.io", "platform bisnis digital",
    ],
    authors: [{ name: "Beres.io", url: siteUrl }],
    creator: "Beres.io",
    publisher: "Beres.io",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    openGraph: {
        type: "website",
        locale: "id_ID",
        url: siteUrl,
        siteName: "Beres.io",
        title: "Beres.io — Solusi Bisnis Digital Terpadu untuk UMKM",
        description:
            "Kasir digital, inventori, laporan keuangan, dan pengiriman dalam satu platform. Kelola semua cabang dari satu dashboard. Coba gratis 14 hari.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "Beres.io — Platform Manajemen Bisnis UMKM Indonesia",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Beres.io — Solusi Bisnis Digital Terpadu untuk UMKM",
        description:
            "Kasir digital, inventori, laporan keuangan, dan pengiriman dalam satu platform cloud untuk UMKM Indonesia.",
        images: ["/og-image.png"],
        creator: "@beresio",
        site: "@beresio",
    },
    alternates: {
        canonical: siteUrl,
        languages: { "id-ID": siteUrl },
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/icon.svg", type: "image/svg+xml" },
        ],
        apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
};

// ── JSON-LD Structured Data ───────────────────────────────────────────────────
const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: "Beres.io",
            url: siteUrl,
            logo: { "@type": "ImageObject", url: `${siteUrl}/logo.svg` },
            sameAs: [
                "https://twitter.com/beresio",
                "https://www.instagram.com/beresio",
                "https://www.linkedin.com/company/beresio",
            ],
        },
        {
            "@type": "SoftwareApplication",
            "@id": `${siteUrl}/#software`,
            name: "Beres.io",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web, iOS, Android",
            url: siteUrl,
            description:
                "Platform manajemen bisnis UMKM Indonesia: kasir digital, inventori, laporan keuangan, dan pengiriman dalam satu platform cloud.",
            offers: [
                { "@type": "Offer", name: "Starter", price: "299000", priceCurrency: "IDR" },
                { "@type": "Offer", name: "Professional", price: "799000", priceCurrency: "IDR" },
                { "@type": "Offer", name: "Enterprise", price: "1999000", priceCurrency: "IDR" },
            ],
            publisher: { "@id": `${siteUrl}/#organization` },
        },
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            url: siteUrl,
            name: "Beres.io",
            inLanguage: "id-ID",
            publisher: { "@id": `${siteUrl}/#organization` },
        },
    ],
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id" suppressHydrationWarning>
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </head>
            <body className={`${jakarta.variable} font-sans antialiased bg-background relative overflow-x-hidden`}>
                <LayoutProvider>
                    <Navbar />
                    <main className="min-h-screen w-full bg-background relative z-10">
                        {children}
                    </main>
                    <Footer />
                    <Toaster />
                </LayoutProvider>
            </body>
        </html>
    );
}
