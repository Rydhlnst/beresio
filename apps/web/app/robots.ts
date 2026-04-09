import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beres.io";

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
                    "/sign-in",
                    "/sign-up",
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
