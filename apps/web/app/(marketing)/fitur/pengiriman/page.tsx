import type { Metadata } from "next";
import {
    Bell,
    Bike,
    CheckCircle,
    Clock,
    MapPin,
    Route,
    Store,
    Truck,
} from "lucide-react";
import { FeatureLandingTemplate } from "../_components/FeatureLandingTemplate";

export const metadata: Metadata = {
    title: "Manajemen Pengiriman - Integrasi Driver & Logistik",
    description:
        "Kelola pengiriman dengan mudah. Integrasi driver sendiri, Gojek, dan Grab dalam satu platform. Tracking real-time dan notifikasi otomatis.",
};

const FEATURE_ITEMS = [
    {
        title: "Multi-kurir dalam satu alur",
        description:
            "Gunakan driver internal, layanan instan, atau mitra kurir eksternal tanpa memecah workflow operasional.",
        icon: Bike,
    },
    {
        title: "Pelacakan pengiriman real-time",
        description:
            "Pantau pergerakan kurir dan status order langsung dari dashboard agar tim customer service lebih siap.",
        icon: MapPin,
    },
    {
        title: "Optimasi rute otomatis",
        description:
            "Sistem membantu menentukan rute yang lebih efisien untuk mengurangi keterlambatan dan biaya kirim.",
        icon: Route,
    },
    {
        title: "Notifikasi pelanggan terjadwal",
        description:
            "Kirim update status pengiriman otomatis ke pelanggan agar ekspektasi layanan lebih jelas.",
        icon: Bell,
    },
    {
        title: "Manajemen performa driver",
        description:
            "Lihat produktivitas driver berdasarkan delivery completion dan kecepatan layanan.",
        icon: Truck,
    },
    {
        title: "Integrasi kanal penjualan",
        description:
            "Order dari platform e-commerce bisa langsung masuk ke alur pengiriman tanpa input ulang.",
        icon: Store,
    },
];

const SPOTLIGHT_ITEMS = [
    {
        title: "Instant delivery",
        description: "Pengiriman cepat untuk order prioritas dengan estimasi yang lebih terkontrol.",
        icon: Clock,
        tag: "1-3 jam",
    },
    {
        title: "Same day delivery",
        description: "Pilihan ideal untuk order reguler yang tetap butuh sampai di hari yang sama.",
        icon: Truck,
        tag: "4-8 jam",
    },
    {
        title: "Next day delivery",
        description: "Mode hemat untuk pengiriman non-urgent yang tetap terpantau statusnya.",
        icon: CheckCircle,
        tag: "1 hari",
    },
    {
        title: "Customer update",
        description: "Pelanggan menerima progress order otomatis dari proses pickup sampai diterima.",
        icon: Bell,
        tag: "Auto notify",
    },
];

export default function PengirimanPage() {
    return (
        <FeatureLandingTemplate
            badgeLabel="Logistik Terpadu"
            title="Manajemen Pengiriman"
            subtitle="Pengiriman Lebih Terkontrol dari Ujung ke Ujung"
            description="Rancang alur logistik yang lebih rapi dengan tracking real-time, pilihan kurir fleksibel, dan notifikasi otomatis untuk pelanggan."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
            featureSection={{
                eyebrow: "Delivery Operations",
                title: "Satu sistem untuk koordinasi kurir dan status pengiriman",
                description:
                    "Beres Cloud menghubungkan tim operasional, driver, dan pelanggan ke dalam workflow pengiriman yang lebih konsisten.",
                items: FEATURE_ITEMS,
            }}
            spotlightSection={{
                eyebrow: "Delivery Mode",
                title: "Pilih skema pengiriman sesuai kebutuhan order",
                description:
                    "Setiap tipe pengiriman memiliki ritme layanan yang berbeda dan tetap dapat dipantau dari dashboard yang sama.",
                items: SPOTLIGHT_ITEMS,
            }}
            operationsSection={{
                eyebrow: "Fulfillment Control",
                title: "Pastikan order keluar lebih cepat tanpa kehilangan visibilitas",
                description:
                    "Atur prioritas pengiriman, pantau posisi kurir, dan jaga pengalaman pelanggan tetap konsisten sepanjang proses fulfillment.",
                bullets: [
                    "Order masuk otomatis ke pipeline pengiriman yang tepat",
                    "Tim bisa melihat bottleneck pengiriman lebih cepat",
                    "Estimasi waktu kirim lebih akurat untuk komunikasi pelanggan",
                    "Status pengiriman terdokumentasi untuk evaluasi performa",
                ],
                panelTitle: "Delivery Tracking Hub",
                panelDescription:
                    "Panel tracking memberi visibilitas real-time untuk setiap order, dari proses pickup sampai barang diterima pelanggan.",
                panelIcon: MapPin,
            }}
            finalSection={{
                title: "Ingin pengiriman bisnis lebih predictable?",
                description:
                    "Aktifkan manajemen pengiriman Beres Cloud agar tim Anda bisa menjaga SLA dengan koordinasi yang lebih sederhana.",
                primaryCta: { label: "Mulai Free Trial", href: "/wishlist" },
                secondaryCta: { label: "Lihat Manajemen Tim", href: "/fitur/tim" },
            }}
        />
    );
}
