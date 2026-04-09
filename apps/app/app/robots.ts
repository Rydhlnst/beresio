import type { MetadataRoute } from "next";

const appUrl =
    process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? "https://app.beres.io";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                disallow: "/",
            },
        ],
        host: appUrl,
    };
}
