import { Metadata } from "next";
import { ReportsPageClient } from "./_components/reports-page-client";

export const metadata: Metadata = {
    title: "Laporan | Beres",
    description: "Source of truth untuk keputusan finansial dan operasional",
};

export default function LaporanPage() {
    return <ReportsPageClient />;
}
