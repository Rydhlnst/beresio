import type { Metadata } from "next";
import {
    BarChart3,
    Calendar,
    Download,
    Eye,
    FileText,
    Filter,
    PieChart,
    TrendingUp,
} from "lucide-react";
import { FeatureLandingTemplate } from "../_components/FeatureLandingTemplate";

export const metadata: Metadata = {
    title: "Laporan & Analitik - Dashboard Performa Bisnis",
    description:
        "Dashboard lengkap untuk memantau performa bisnis Anda. Laporan P&L, arus kas, penjualan, dan analitik mendalam lainnya.",
};

const FEATURE_ITEMS = [
    {
        title: "Profit and loss real-time",
        description:
            "Pantau pendapatan, pengeluaran, dan profit bersih per periode tanpa proses kompilasi manual.",
        icon: TrendingUp,
    },
    {
        title: "Kontrol arus kas harian",
        description:
            "Lihat cash in dan cash out secara rinci agar keputusan operasional tidak tertunda.",
        icon: BarChart3,
    },
    {
        title: "Analisis produk terlaris",
        description:
            "Identifikasi SKU dengan kontribusi paling tinggi untuk strategi stok dan promosi.",
        icon: PieChart,
    },
    {
        title: "Laporan perpajakan siap pakai",
        description:
            "Hasilkan dokumen sesuai kebutuhan administrasi bisnis dengan format yang lebih rapi.",
        icon: FileText,
    },
    {
        title: "Export ke berbagai format",
        description:
            "Unduh laporan dalam PDF, Excel, dan CSV untuk kebutuhan audit, internal meeting, atau investor.",
        icon: Download,
    },
    {
        title: "Penjadwalan laporan otomatis",
        description:
            "Atur laporan terjadwal agar owner dan tim menerima insight rutin tanpa pekerjaan berulang.",
        icon: Calendar,
    },
];

const SPOTLIGHT_ITEMS = [
    {
        title: "Total penjualan terkonsolidasi",
        description: "Ringkasan penjualan lintas channel untuk monitoring pertumbuhan periodik.",
        icon: BarChart3,
        tag: "Rp 125M+",
    },
    {
        title: "Refresh data sangat cepat",
        description: "Dashboard update nyaris instan untuk membantu keputusan harian.",
        icon: Eye,
        tag: "< 1 detik",
    },
    {
        title: "Pilihan export lengkap",
        description: "Gunakan format file sesuai kebutuhan tim operasional, finance, atau akuntan.",
        icon: Download,
        tag: "5+ format",
    },
    {
        title: "Metrik bisnis mendalam",
        description: "Akses puluhan metrik untuk membaca performa dari banyak sudut pandang.",
        icon: PieChart,
        tag: "50+ metrik",
    },
];

export default function LaporanPage() {
    return (
        <FeatureLandingTemplate
            badgeLabel="Business Intelligence"
            title="Laporan dan Analitik"
            subtitle="Data Operasional yang Langsung Bisa Ditindak"
            description="Baca performa bisnis Anda dari dashboard yang lebih tajam, lalu ubah insight menjadi aksi tanpa menunggu akhir bulan."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            featureSection={{
                eyebrow: "Reporting Stack",
                title: "Laporan finansial dan operasional dalam satu workflow",
                description:
                    "Beres.io menyajikan laporan inti bisnis secara otomatis, agar tim Anda fokus pada keputusan dan bukan kompilasi data.",
                items: FEATURE_ITEMS,
            }}
            spotlightSection={{
                eyebrow: "Quick Insight",
                title: "Ambil gambaran bisnis dalam hitungan detik",
                description:
                    "Gunakan metrik yang paling relevan untuk memonitor kesehatan bisnis tanpa menunggu proses akhir periode.",
                items: SPOTLIGHT_ITEMS,
            }}
            operationsSection={{
                eyebrow: "Custom Reporting",
                title: "Sesuaikan laporan sesuai kebutuhan keputusan Anda",
                description:
                    "Dari filter cabang sampai template laporan favorit, semua dibuat fleksibel agar analisis tidak menghambat kecepatan eksekusi.",
                bullets: [
                    "Filter per cabang, kategori, dan rentang waktu yang spesifik",
                    "Bandingkan performa antar periode untuk membaca tren",
                    "Simpan template laporan favorit agar tim lebih cepat bekerja",
                    "Bagikan laporan ke tim internal dengan format yang rapi",
                ],
                panelTitle: "Analytics Workspace",
                panelDescription:
                    "Panel analitik menampilkan metrik prioritas lebih dulu agar owner dan manajer bisa memutuskan langkah berikutnya dengan cepat.",
                panelIcon: Filter,
            }}
            finalSection={{
                title: "Siap jalankan bisnis berbasis data?",
                description:
                    "Aktifkan laporan dan analitik Beres.io untuk mengambil keputusan yang lebih terarah di setiap level operasional.",
                primaryCta: { label: "Mulai Free Trial", href: "/wishlist" },
                secondaryCta: { label: "Lihat Multi-Cabang", href: "/fitur/multi-cabang" },
            }}
        />
    );
}
