import type { Metadata } from "next";
import {
    AlertTriangle,
    BarChart3,
    Bell,
    History,
    Package,
    Search,
    Tags,
    Truck,
} from "lucide-react";
import { FeatureLandingTemplate } from "../_components/FeatureLandingTemplate";

export const metadata: Metadata = {
    title: "Manajemen Inventori - Pantau Stok Real-Time",
    description:
        "Kelola inventori bisnis Anda dengan mudah. Pantau stok real-time, dapatkan alert otomatis, dan lacak riwayat pergerakan barang.",
};

const FEATURE_ITEMS = [
    {
        title: "Stok real-time lintas cabang",
        description:
            "Pantau ketersediaan barang per outlet tanpa perlu rekap manual dari banyak spreadsheet.",
        icon: BarChart3,
    },
    {
        title: "Alert stok menipis otomatis",
        description:
            "Sistem memberi notifikasi saat stok mendekati batas minimum agar pembelian ulang lebih terencana.",
        icon: Bell,
    },
    {
        title: "Audit trail pergerakan barang",
        description:
            "Lacak siapa yang menambah, mengurangi, atau mengubah data stok untuk menjaga akurasi operasional.",
        icon: History,
    },
    {
        title: "Produk multi-varian",
        description:
            "Kelola ukuran, warna, atau atribut lain dalam struktur inventori yang tetap rapi dan mudah dicari.",
        icon: Tags,
    },
    {
        title: "Transfer stok antar outlet",
        description:
            "Pindahkan stok antar cabang dengan alur approval terkontrol supaya mutasi tidak menimbulkan selisih.",
        icon: Truck,
    },
    {
        title: "Pencarian SKU super cepat",
        description:
            "Temukan item berdasarkan nama, SKU, atau barcode dalam hitungan detik saat operasional berlangsung.",
        icon: Search,
    },
];

const SPOTLIGHT_ITEMS = [
    {
        title: "Stok hampir habis",
        description: "Notifikasi prioritas untuk item dengan tingkat konsumsi tinggi.",
        icon: AlertTriangle,
        tag: "Critical",
    },
    {
        title: "Stok berlebih",
        description: "Deteksi produk yang menumpuk agar perputaran persediaan tetap sehat.",
        icon: Package,
        tag: "Warning",
    },
    {
        title: "Mendekati expired",
        description: "Reminder terjadwal untuk produk yang perlu diprioritaskan penjualannya.",
        icon: Bell,
        tag: "Reminder",
    },
    {
        title: "Riwayat mutasi",
        description: "Semua perubahan stok tercatat agar investigasi selisih bisa dilakukan lebih cepat.",
        icon: History,
        tag: "Tracking",
    },
];

export default function InventoriPage() {
    return (
        <FeatureLandingTemplate
            badgeLabel="Inventori Beres Cloud"
            title="Kontrol Inventori"
            subtitle="Presisi Stok untuk Operasional yang Stabil"
            description="Satukan monitoring stok, alert otomatis, dan mutasi barang ke dalam satu workspace yang lebih mudah dioperasikan tim Anda."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
            featureSection={{
                eyebrow: "Inventory Control",
                title: "Sistem inventori yang membantu Anda bergerak lebih cepat",
                description:
                    "Dari monitoring sampai transfer antar cabang, setiap aktivitas stok dibuat lebih terstruktur agar risiko stockout bisa ditekan.",
                items: FEATURE_ITEMS,
            }}
            spotlightSection={{
                eyebrow: "Smart Alert",
                title: "Peringatan cerdas untuk item yang perlu tindakan cepat",
                description:
                    "Anda tidak perlu cek gudang manual setiap saat karena sistem memberikan sinyal operasional yang paling penting lebih dulu.",
                items: SPOTLIGHT_ITEMS,
            }}
            operationsSection={{
                eyebrow: "Decision Support",
                title: "Kurangi kehilangan penjualan akibat stok tidak terkendali",
                description:
                    "Beres Cloud membantu tim gudang dan outlet mengambil keputusan restock berdasarkan data aktual, bukan asumsi.",
                bullets: [
                    "Owner dan manager melihat status stok dari dashboard yang sama",
                    "Tim gudang mendapat prioritas item yang harus segera ditangani",
                    "Mutasi antar cabang tercatat dengan approval yang jelas",
                    "Pencarian SKU lebih cepat saat pelayanan pelanggan berlangsung",
                ],
                panelTitle: "Inventory Workspace",
                panelDescription:
                    "Satu panel operasional untuk memonitor level stok, alert, serta aktivitas mutasi barang secara real-time.",
                panelIcon: Package,
            }}
            finalSection={{
                title: "Ingin stok bisnis tetap aman setiap hari?",
                description:
                    "Mulai kelola inventori dengan alur yang lebih presisi agar tim Anda tidak lagi reaktif terhadap masalah stok.",
                primaryCta: { label: "Mulai Free Trial", href: "/wishlist" },
                secondaryCta: { label: "Lihat Fitur Laporan", href: "/fitur/laporan" },
            }}
        />
    );
}
