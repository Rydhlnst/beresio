import type { Metadata } from "next";
import {
    BarChart3,
    Building2,
    CheckCircle,
    FileText,
    Globe,
    Shield,
    Store,
    Users,
} from "lucide-react";
import { IndustrySolutionTemplate } from "@/app/_components/IndustrySolutionTemplate";

export const metadata: Metadata = {
    title: "Solusi Franchise - Standardisasi Multi-Gerai",
    description:
        "Kelola franchise dengan standardisasi operasional, approval workflow, royalty reporting, dan kontrol brand konsisten di semua gerai.",
};

const FEATURES = [
    {
        title: "SOP Standardization",
        description: "Pastikan menu, harga, promo, dan proses operasional konsisten di semua gerai.",
        icon: CheckCircle,
    },
    {
        title: "Approval Workflow",
        description: "Perubahan lokal franchisee tetap terkendali lewat approval berlapis.",
        icon: Shield,
    },
    {
        title: "Royalty Automation",
        description: "Hitung dan pantau royalty fee berdasarkan data penjualan aktual.",
        icon: FileText,
    },
    {
        title: "Franchisor Dashboard",
        description: "Monitor performa seluruh jaringan franchise dari satu panel pusat.",
        icon: BarChart3,
    },
    {
        title: "Role-Based Portal",
        description: "Akses berbeda untuk franchisor, regional manager, franchisee, dan staff.",
        icon: Users,
    },
    {
        title: "Multi-Regional Setup",
        description: "Kelola konfigurasi lokal tanpa mengorbankan standar brand nasional.",
        icon: Globe,
    },
];

export default function FranchisePage() {
    return (
        <IndustrySolutionTemplate
            dashboardVariant="franchise"
            badgeLabel="Enterprise Franchise Solution"
            title="Scale Jaringan Franchise"
            subtitle="Tanpa Kehilangan Kendali Operasional"
            description="Beres memberi franchisor kontrol real-time terhadap performa gerai, kepatuhan SOP, dan laporan royalty. Ekspansi tetap cepat tanpa mengorbankan kualitas eksekusi."
            primaryCta={{ label: "Hubungi Sales", href: "/sales" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            heroHighlights={[
                "SOP brand diterapkan konsisten di semua gerai.",
                "Approval perubahan berjalan jelas dan terdokumentasi.",
                "Royalty reporting otomatis berbasis data transaksi valid.",
                "Performa regional bisa dibandingkan dalam satu dashboard.",
            ]}
            dashboardTitle="Franchise Control Tower"
            dashboardSubtitle="Network Governance"
            dashboardWidgets={[
                { label: "Gerai Aktif", value: "142", change: "+12 gerai kuartal ini" },
                { label: "SOP Compliance", value: "96%", change: "+8% sejak audit digital" },
                { label: "Royalty Accuracy", value: "99,3%", change: "Closing bulanan lebih cepat" },
            ]}
            dashboardItems={[
                { title: "Request promo lokal region Barat menunggu approval", status: "prioritas", eta: "40 menit" },
                { title: "Audit checklist gerai Jabodetabek selesai", status: "stabil", eta: "Selesai" },
                { title: "Outlier performa 3 gerai butuh review area manager", status: "perhatian", eta: "Hari ini" },
            ]}
            featuresTitle="Infrastruktur Operasional untuk Ekspansi Franchise"
            featuresDescription="Platform ini dibuat untuk franchisor yang ingin scale agresif namun tetap disiplin pada standar brand."
            features={FEATURES}
            workflowTitle="Governance yang Tetap Lincah"
            workflowDescription="Franchisor mendapatkan visibilitas penuh, sementara franchisee tetap punya ruang eksekusi yang terkontrol."
            workflows={[
                {
                    title: "Central Policy Engine",
                    detail: "Aturan inti brand disebarkan ke seluruh jaringan dalam satu kali publish.",
                    value: "Head Office Command",
                    icon: Building2,
                },
                {
                    title: "Regional Oversight",
                    detail: "Manajer regional memonitor KPI, audit, dan implementasi promosi lokal.",
                    value: "Area Performance Layer",
                    icon: Globe,
                },
                {
                    title: "Store Execution",
                    detail: "Tim gerai menjalankan SOP harian dengan checklists dan guardrails otomatis.",
                    value: "Outlet-Level Discipline",
                    icon: Store,
                },
            ]}
            proofTitle="Kapasitas Scale Dengan Risiko Lebih Rendah"
            proofDescription="Franchise tumbuh lebih cepat ketika standarisasi dan visibilitas berjalan bersamaan."
            proofPoints={[
                { label: "Audit Speed", value: "2.4x", description: "Proses compliance antar gerai lebih cepat." },
                { label: "SOP Drift", value: "-39%", description: "Pelanggaran standar operasional menurun." },
                { label: "Royalty Closing", value: "-45%", description: "Waktu rekonsiliasi bulanan berkurang." },
                { label: "Regional Visibility", value: "100%", description: "KPI lintas area termonitor harian." },
            ]}
            closingCta={{
                title: "Siap Membesarkan Franchise Dengan Sistem yang Terkontrol?",
                description: "Diskusikan kebutuhan struktur organisasi dan workflow approval franchise Anda bersama tim Beres.",
                primaryLabel: "Konsultasi Dengan Sales",
                primaryHref: "/sales",
                secondaryLabel: "Lihat Fitur Multi-Cabang",
                secondaryHref: "/fitur/multi-cabang",
            }}
        />
    );
}
