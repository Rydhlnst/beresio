import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.io";

export const revalidate = 3600;

type SitemapEntry = {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
};

const PUBLIC_PAGES: SitemapEntry[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/harga", changeFrequency: "weekly", priority: 0.95 },
    { path: "/demo", changeFrequency: "weekly", priority: 0.9 },
    { path: "/sales", changeFrequency: "weekly", priority: 0.9 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/careers", changeFrequency: "weekly", priority: 0.75 },
    { path: "/partnership", changeFrequency: "monthly", priority: 0.75 },
    { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
    { path: "/tutorial", changeFrequency: "weekly", priority: 0.8 },
    { path: "/changelog", changeFrequency: "weekly", priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.75 },
    { path: "/wishlist", changeFrequency: "weekly", priority: 0.8 },
    { path: "/support", changeFrequency: "weekly", priority: 0.8 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
    { path: "/fitur/kasir", changeFrequency: "weekly", priority: 0.85 },
    { path: "/fitur/inventori", changeFrequency: "weekly", priority: 0.85 },
    { path: "/fitur/laporan", changeFrequency: "weekly", priority: 0.85 },
    { path: "/fitur/pengiriman", changeFrequency: "weekly", priority: 0.85 },
    { path: "/fitur/multi-cabang", changeFrequency: "weekly", priority: 0.85 },
    { path: "/fitur/tim", changeFrequency: "weekly", priority: 0.85 },
    { path: "/solusi/fnb", changeFrequency: "weekly", priority: 0.85 },
    { path: "/solusi/retail", changeFrequency: "weekly", priority: 0.85 },
    { path: "/solusi/laundry", changeFrequency: "weekly", priority: 0.85 },
    { path: "/solusi/salon", changeFrequency: "weekly", priority: 0.85 },
    { path: "/solusi/franchise", changeFrequency: "weekly", priority: 0.85 },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    return PUBLIC_PAGES.map((page) => ({
        url: `${siteUrl}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
    }));
}
