/**
 * SEO Configuration & Utilities
 * 
 * Centralized SEO metadata generation helpers for consistent
 * SEO optimization across all landing pages.
 */

import type { Metadata } from "next";

// ── Site Configuration ───────────────────────────────────────────────────────

export const siteConfig = {
    name: "Beres.io",
    shortName: "Beres",
    description:
        "Beres.io menghadirkan kasir digital (POS), manajemen inventori, laporan keuangan, dan manajemen pengiriman dalam satu platform cloud untuk UMKM Indonesia.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.io",
    ogImage: "/og-image.svg",
    twitter: "@beresio",
    locale: "id_ID",
    language: "id",
    author: "Beres.io",
    themeColor: "#EE4822",
} as const;

// ── Default Keywords ─────────────────────────────────────────────────────────

export const defaultKeywords = [
    "kasir digital",
    "POS UMKM",
    "manajemen inventori",
    "laporan keuangan usaha",
    "software kasir Indonesia",
    "ERP UMKM",
    "multi cabang",
    "beres.io",
    "platform bisnis digital",
    "aplikasi kasir online",
    "sistem POS Indonesia",
    "manajemen bisnis UMKM",
    "software manajemen inventori",
    "aplikasi laporan keuangan",
    "cloud POS Indonesia",
];

// ── Page-Specific Keywords ───────────────────────────────────────────────────

export const pageKeywords = {
    harga: [
        "harga software kasir",
        "harga POS Indonesia",
        "harga ERP UMKM",
        "paket software bisnis",
        "harga kasir digital",
        "biaya langganan POS",
        "pricing POS Indonesia",
    ],
    demo: [
        "demo software kasir",
        "trial POS online",
        "demo aplikasi kasir",
        "jadwal demo software",
    ],
    support: [
        "bantuan software kasir",
        "support POS Indonesia",
        "customer service ERP",
        "pusat bantuan UMKM",
    ],
    privacy: [
        "kebijakan privasi software",
        "keamanan data bisnis",
        "perlindungan data UMKM",
    ],
    terms: [
        "syarat ketentuan software",
        "ketentuan layanan POS",
        "perjanjian penggunaan",
    ],
    fnb: [
        "POS restoran",
        "software restoran Indonesia",
        "kasir cafe online",
        "manajemen restoran",
        "POS F&B Indonesia",
    ],
    retail: [
        "POS retail Indonesia",
        "software toko online",
        "kasir toko kelontong",
        "manajemen stok retail",
    ],
    laundry: [
        "software laundry Indonesia",
        "aplikasi laundry online",
        "manajemen cucian",
        "tracking laundry",
        "kasir laundry digital",
    ],
    salon: [
        "software salon Indonesia",
        "aplikasi booking salon",
        "manajemen spa",
        "sistem reservasi treatment",
    ],
    franchise: [
        "software franchise Indonesia",
        "manajemen multi outlet",
        "sistem POS franchise",
    ],
    kasir: [
        "POS digital Indonesia",
        "sistem kasir online",
        "kasir digital UMKM",
        "mesin kasir cloud",
    ],
    inventori: [
        "software inventori",
        "manajemen stok barang",
        "sistem inventory online",
        "tracking stok real-time",
    ],
    laporan: [
        "laporan keuangan otomatis",
        "analisis bisnis UMKM",
        "dashboard keuangan",
        "reporting bisnis online",
    ],
    pengiriman: [
        "manajemen pengiriman",
        "sistem delivery order",
        "tracking pengiriman",
        "integrasi kurir online",
    ],
    tim: [
        "manajemen karyawan",
        "absensi online",
        "akses pengguna POS",
    ],
    "multi-cabang": [
        "software multi cabang",
        "manajemen outlet",
        "sistem terpusat cabang",
    ],
} as const;

// ── Metadata Generator ───────────────────────────────────────────────────────

interface MetadataOptions {
    title: string;
    description: string;
    keywords?: readonly string[];
    image?: string;
    canonical?: string;
    noIndex?: boolean;
    alternates?: Metadata["alternates"];
    openGraph?: Partial<Metadata["openGraph"]>;
    twitter?: Partial<Metadata["twitter"]>;
}

export function generateMetadata(options: MetadataOptions): Metadata {
    const {
        title,
        description,
        keywords = [],
        image = siteConfig.ogImage,
        canonical,
        noIndex = false,
        alternates,
        openGraph,
        twitter,
    } = options;

    const ogImageUrl = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

    return {
        metadataBase: new URL(siteConfig.url),
        title: `${title} | ${siteConfig.name}`,
        description,
        keywords: [...defaultKeywords, ...keywords],
        authors: [{ name: siteConfig.author, url: siteConfig.url }],
        creator: siteConfig.author,
        publisher: siteConfig.author,
        robots: {
            index: !noIndex,
            follow: !noIndex,
            googleBot: {
                index: !noIndex,
                follow: !noIndex,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        openGraph: {
            type: "website",
            locale: siteConfig.locale,
            url: canonical ?? siteConfig.url,
            siteName: siteConfig.name,
            title: `${title} | ${siteConfig.name}`,
            description,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${title} — ${siteConfig.name}`,
                },
            ],
            ...openGraph,
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | ${siteConfig.name}`,
            description,
            images: [ogImageUrl],
            creator: siteConfig.twitter,
            site: siteConfig.twitter,
            ...twitter,
        },
        alternates: {
            canonical: canonical ?? siteConfig.url,
            languages: { "id-ID": siteConfig.url },
            ...alternates,
        },
    };
}

// ── Schema.org Generators ────────────────────────────────────────────────────

export function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: {
            "@type": "ImageObject",
            url: `${siteConfig.url}/logo.svg`,
        },
        sameAs: [
            "https://twitter.com/beresio",
            "https://www.instagram.com/beresio",
            "https://www.linkedin.com/company/beresio",
        ],
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            availableLanguage: ["Indonesian", "English"],
        },
    };
}

export function generateWebsiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: siteConfig.locale,
        publisher: {
            "@id": `${siteConfig.url}/#organization`,
        },
    };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };
}

export function generateSoftwareApplicationSchema(
    name: string,
    description: string,
    offers: { name: string; price: string; description?: string }[]
) {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name,
        description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        url: siteConfig.url,
        offers: offers.map((offer) => ({
            "@type": "Offer",
            name: offer.name,
            price: offer.price,
            priceCurrency: "IDR",
            description: offer.description,
        })),
        publisher: {
            "@id": `${siteConfig.url}/#organization`,
        },
    };
}
