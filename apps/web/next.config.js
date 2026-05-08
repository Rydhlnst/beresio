/** @type {import('next').NextConfig} */

const APP_URL = process.env.OWNER_APP_URL || "http://localhost:3001";
const ORDER_APP_URL = process.env.ORDER_APP_URL || "";

const nextConfig = {
    transpilePackages: ["@repo/ui", "@beresio/db"],
    async redirects() {
        return [
            ...(ORDER_APP_URL
                ? [{ source: "/order/:path*", destination: `${ORDER_APP_URL}/order/:path*`, permanent: false }]
                : []),
            // Auth routes -> owner dashboard app
            { source: "/login", destination: `${APP_URL}/login`, permanent: false },
            { source: "/sign-in", destination: `${APP_URL}/sign-in`, permanent: false },
            { source: "/sign-up", destination: `${APP_URL}/sign-up`, permanent: false },
            { source: "/register", destination: `${APP_URL}/register`, permanent: false },
            { source: "/forgot-password", destination: `${APP_URL}/forgot-password`, permanent: false },
            { source: "/reset-password", destination: `${APP_URL}/reset-password`, permanent: false },
            { source: "/verify-email", destination: `${APP_URL}/verify-email`, permanent: false },
            { source: "/welcome", destination: `${APP_URL}/welcome`, permanent: false },
            { source: "/join", destination: `${APP_URL}/join`, permanent: false },
            // Dashboard routes -> owner dashboard app
            { source: "/dashboard", destination: `${APP_URL}/dashboard`, permanent: false },
            { source: "/dashboard/:path*", destination: `${APP_URL}/dashboard/:path*`, permanent: false },
        ];
    },
    compress: true,
    poweredByHeader: false,
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                pathname: "/**",
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
    experimental: {
        optimizePackageImports: ["lucide-react", "@repo/ui", "framer-motion", "recharts"],
    },
};

export default nextConfig;
