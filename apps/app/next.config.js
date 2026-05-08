/** @type {import('next').NextConfig} */
function toHostname(value) {
    if (!value) return null;
    try {
        return new URL(value).hostname;
    } catch {
        return value;
    }
}

const uploadAssetHost = toHostname(process.env.NEXT_PUBLIC_UPLOAD_ASSET_HOST);

const nextConfig = {
    transpilePackages: ["@repo/ui", "@beresio/db"],
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
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "**.r2.dev",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "**.r2.cloudflarestorage.com",
                pathname: "/**",
            },
            ...(uploadAssetHost
                ? [
                    {
                        protocol: "https",
                        hostname: uploadAssetHost,
                        pathname: "/**",
                    },
                ]
                : []),
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },
    experimental: {
        optimizePackageImports: ["lucide-react", "@repo/ui", "framer-motion", "recharts"],
    },
    async redirects() {
        return [
            {
                source: "/branches/:path*",
                destination: "/cabang/:path*",
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
