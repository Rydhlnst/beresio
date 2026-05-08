/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/ui"],
    compress: true,
    poweredByHeader: false,
};

export default nextConfig;
