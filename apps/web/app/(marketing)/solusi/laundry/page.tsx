import type { Metadata } from "next";
import {
    Bell,
    CheckCircle,
    Clock,
    Package,
    Sparkles,
    Truck,
    WashingMachine,
} from "lucide-react";
import { IndustrySolutionTemplate } from "@/app/_components/IndustrySolutionTemplate";

export const metadata: Metadata = {
    title: "Solusi Laundry - Order, Tracking & Notifikasi Otomatis",
    description:
        "Software laundry lengkap dengan order management, tracking status cucian, notifikasi siap ambil, dan laporan keuangan otomatis.",
};

const FEATURES = [
    {
        title: "Order Intake Terpadu",
        description: "Order dari kasir, WhatsApp, dan pickup request masuk ke satu antrean.",
        icon: Package,
    },
    {
        title: "Tracking per Tahap",
        description: "Status diterima, dicuci, disetrika, dan siap ambil tercatat otomatis.",
        icon: CheckCircle,
    },
    {
        title: "Reminder Otomatis",
        description: "Notifikasi pelanggan dikirim saat order hampir selesai dan siap pickup.",
        icon: Bell,
    },
    {
        title: "Pickup & Delivery Route",
        description: "Kelola jadwal kurir internal sekaligus request delivery eksternal.",
        icon: Truck,
    },
    {
        title: "Service Package Engine",
        description: "Atur harga kiloan, express, dry clean, dan paket langganan pelanggan.",
        icon: Sparkles,
    },
    {
        title: "Cycle Time Report",
        description: "Pantau lama proses tiap order untuk menjaga SLA layanan laundry.",
        icon: Clock,
    },
];

export default function LaundryPage() {
    return (
        <IndustrySolutionTemplate
            dashboardVariant="laundry"
            badgeLabel="Solusi Industri Laundry"
            title="Operasional Laundry"
            subtitle="Cepat, Rapi, dan Terukur"
            description="Beres membantu tim laundry mengelola order masuk, tracking progres, dan pengiriman tanpa chaos. Semua langkah proses tersusun jelas dari counter ke pelanggan."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            heroHighlights={[
                "Status cucian selalu up-to-date untuk tim dan pelanggan.",
                "Kurangi komplain keterlambatan dengan SLA berbasis data.",
                "Standardisasi alur kiloan, express, dan premium treatment.",
                "Notifikasi otomatis untuk pickup dan delivery.",
            ]}
            dashboardTitle="Laundry Operations Board"
            dashboardSubtitle="Order Lifecycle"
            dashboardWidgets={[
                { label: "Order Aktif", value: "324", change: "+11% minggu ini" },
                { label: "On-Time Ready", value: "94%", change: "SLA target 90%" },
                { label: "Avg Cycle", value: "19 jam", change: "-3 jam vs bulan lalu" },
            ]}
            dashboardItems={[
                { title: "Batch express #LX-220 perlu prioritas mesin dry", status: "prioritas", eta: "45 menit" },
                { title: "Pickup cluster Kemang siap dispatch", status: "stabil", eta: "20 menit" },
                { title: "Order reguler area Barat melewati SLA", status: "perhatian", eta: "1 jam" },
            ]}
            featuresTitle="Sistem Eksekusi Harian Untuk Laundry Modern"
            featuresDescription="Fokus pada kecepatan turnover, transparansi status order, dan pengalaman pelanggan yang konsisten."
            features={FEATURES}
            workflowTitle="Kontrol Penuh Dari Intake Sampai Delivery"
            workflowDescription="Setiap peran tim melihat prioritas kerja yang sama sehingga produksi tetap stabil walau volume order naik."
            workflows={[
                {
                    title: "Order Intake Discipline",
                    detail: "Semua order punya nomor tracking dan SLA sejak menit pertama diterima.",
                    value: "Unified Intake Queue",
                    icon: Package,
                },
                {
                    title: "Production Monitoring",
                    detail: "Lihat bottleneck proses cuci-setrika-finishing secara live per outlet.",
                    value: "Stage-Based Tracking",
                    icon: WashingMachine,
                },
                {
                    title: "Delivery Assurance",
                    detail: "Jadwal pickup/delivery dan notifikasi pelanggan tersinkron otomatis.",
                    value: "Automated Customer Updates",
                    icon: Truck,
                },
            ]}
            proofTitle="Hasil yang Dirasakan Tim Operasional"
            proofDescription="Dengan alur yang jelas, laundry bisa meningkatkan throughput tanpa mengorbankan kualitas layanan."
            proofPoints={[
                { label: "SLA Compliance", value: "+23%", description: "Order selesai tepat waktu meningkat." },
                { label: "Komplain Delay", value: "-37%", description: "Keluhan keterlambatan berkurang signifikan." },
                { label: "Repeat Orders", value: "+18%", description: "Pelanggan kembali lebih sering." },
                { label: "Utilisasi Tim", value: "+29%", description: "Beban kerja lebih merata per shift." },
            ]}
            closingCta={{
                title: "Siap Upgrade Operasional Laundry Anda?",
                description: "Rasakan workflow laundry yang terstruktur dari order intake sampai pengantaran, semua dalam satu dashboard.",
                primaryLabel: "Mulai Free Trial",
                primaryHref: "/wishlist",
                secondaryLabel: "Lihat Solusi F&B",
                secondaryHref: "/solusi/fnb",
            }}
        />
    );
}
