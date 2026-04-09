import type { Metadata } from "next";
import { BeresCloudLanding } from "@/app/_components/BeresCloudLanding";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Solusi Bisnis Digital Terpadu untuk UMKM",
    path: "/",
    description:
        "Beres.io menghadirkan kasir digital, inventori, laporan, dan manajemen operasional untuk UMKM Indonesia dalam satu platform cloud.",
});

export default function Page() {
    return <BeresCloudLanding />;
}
