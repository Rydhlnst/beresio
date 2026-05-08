import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.cloud";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/_next/",
                    "/dashboard",
                    "/dashboard/",
                    "/onboarding/",
                    "/login",
                    "/register",
                    "/join",
                    "/forgot-password",
                    "/reset-password",
                    "/verify-email",
                    "/welcome",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
