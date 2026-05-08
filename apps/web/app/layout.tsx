import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@repo/ui";
import { complianceConfig } from "@repo/ui/compliance";
import { LayoutProvider } from "./_components/LayoutProvider";
import { Analytics } from "./_components/Analytics";
import { RouteLoadingIndicator } from "./_components/RouteLoadingIndicator";

const dmSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-jakarta",
    display: "swap",
});

const instrumentSerif = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-beres-instrument-serif",
    display: "swap",
});

export const viewport: Viewport = {
    themeColor: "#EE4822",
    width: "device-width",
    initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? complianceConfig.canonicalDomain;

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: "Beres Cloud - Solusi Bisnis Digital Terpadu untuk UMKM",
        template: `%s | ${complianceConfig.brandName}`,
    },
    description:
        "Beres Cloud menghadirkan kasir digital (POS), manajemen inventori, laporan keuangan, dan manajemen operasional dalam satu platform cloud untuk UMKM Indonesia.",
    keywords: [
        "kasir digital",
        "POS UMKM",
        "manajemen inventori",
        "laporan keuangan usaha",
        "software kasir Indonesia",
        "ERP UMKM",
        "multi cabang",
        "beres cloud",
        "platform bisnis digital",
    ],
    authors: [{ name: complianceConfig.brandName, url: siteUrl }],
    creator: complianceConfig.brandName,
    publisher: complianceConfig.brandName,
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
        siteName: complianceConfig.brandName,
        title: "Beres Cloud - Solusi Bisnis Digital Terpadu untuk UMKM",
        description:
            "Kasir digital, inventori, laporan keuangan, dan pengiriman dalam satu platform. Kelola semua cabang dari satu dashboard.",
        images: [
            {
                url: "/og-image.svg",
                width: 1200,
                height: 630,
                alt: "Beres Cloud - Platform Manajemen Bisnis UMKM Indonesia",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Beres Cloud - Solusi Bisnis Digital Terpadu untuk UMKM",
        description:
            "Kasir digital, inventori, laporan keuangan, dan pengiriman dalam satu platform cloud untuk UMKM Indonesia.",
        images: ["/og-image.svg"],
        creator: "@berescloud",
        site: "@berescloud",
    },
    alternates: {
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

const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: complianceConfig.brandName,
            url: siteUrl,
            legalName: complianceConfig.legalEntityName,
            logo: { "@type": "ImageObject", url: `${siteUrl}/logo.svg` },
            address: {
                "@type": "PostalAddress",
                streetAddress: complianceConfig.businessAddress,
                addressCountry: "ID",
            },
            contactPoint: {
                "@type": "ContactPoint",
                email: complianceConfig.supportEmail,
                telephone: complianceConfig.supportWhatsApp,
                contactType: "customer support",
            },
        },
        {
            "@type": "SoftwareApplication",
            "@id": `${siteUrl}/#software`,
            name: complianceConfig.brandName,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: siteUrl,
            description:
                "Platform manajemen bisnis UMKM Indonesia: kasir digital, inventori, laporan keuangan, dan operasional dalam satu cloud.",
            offers: [
                { "@type": "Offer", name: "Solo", price: "15000", priceCurrency: "IDR" },
                { "@type": "Offer", name: "Starter", price: "99000", priceCurrency: "IDR" },
                { "@type": "Offer", name: "Professional", price: "249000", priceCurrency: "IDR" },
                { "@type": "Offer", name: "Enterprise", price: "599000", priceCurrency: "IDR" },
            ],
            publisher: { "@id": `${siteUrl}/#organization` },
        },
    ],
};

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
            <body
                className={`${dmSans.variable} ${instrumentSerif.variable} font-sans antialiased bg-background relative overflow-x-hidden`}
            >
                <LayoutProvider>
                    <Suspense fallback={null}>
                        <RouteLoadingIndicator />
                    </Suspense>
                    {children}
                    <Toaster />
                    <Analytics />
                </LayoutProvider>
            </body>
        </html>
    );
}
