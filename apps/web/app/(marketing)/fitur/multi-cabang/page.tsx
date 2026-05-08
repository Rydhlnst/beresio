import type { Metadata } from "next";
import {
    ArrowRightLeft,
    BarChart3,
    Building2,
    GitBranch,
    Globe,
    Layers,
    Shield,
    Users,
} from "lucide-react";
import { FeatureLandingTemplate } from "../_components/FeatureLandingTemplate";

export const metadata: Metadata = {
    title: "Multi-Cabang - Kelola Semua Outlet Terpusat",
    description:
        "Kelola semua cabang bisnis Anda dari satu dashboard. Sinkronisasi data real-time, laporan konsolidasi, dan manajemen akses per outlet.",
};

const FEATURE_ITEMS = [
    {
        title: "Dashboard lintas outlet terpusat",
        description:
            "Bandingkan performa cabang dari satu tempat tanpa perpindahan akun dan tanpa konsolidasi manual.",
        icon: BarChart3,
    },
    {
        title: "Sinkronisasi data real-time",
        description:
            "Transaksi, stok, dan laporan antar cabang tersinkron otomatis agar keputusan tetap berbasis data terbaru.",
        icon: ArrowRightLeft,
    },
    {
        title: "Role dan akses berlapis",
        description:
            "Atur hak akses per level organisasi untuk menjaga keamanan data setiap outlet.",
        icon: Shield,
    },
    {
        title: "Transfer stok antar cabang",
        description:
            "Pindahkan persediaan antarlokasi dengan proses approval yang tetap terkontrol.",
        icon: Layers,
    },
    {
        title: "Laporan konsolidasi otomatis",
        description:
            "Lihat performa total bisnis atau drill-down ke cabang tertentu dengan struktur laporan yang sama.",
        icon: GitBranch,
    },
    {
        title: "Dukungan operasional multi-region",
        description:
            "Kelola outlet di kota berbeda tanpa kehilangan konteks waktu operasional dan kebutuhan lokal.",
        icon: Globe,
    },
];

const SPOTLIGHT_ITEMS = [
    {
        title: "Super admin",
        description: "Akses penuh untuk melihat dan mengelola seluruh cabang dari pusat.",
        icon: Shield,
        tag: "Semua cabang",
    },
    {
        title: "Regional manager",
        description: "Kontrol operasional berdasarkan wilayah agar eksekusi lebih terfokus.",
        icon: Building2,
        tag: "Per region",
    },
    {
        title: "Outlet manager",
        description: "Akses terbatas pada cabang yang dikelola untuk menjaga akuntabilitas tim.",
        icon: Users,
        tag: "Per outlet",
    },
    {
        title: "Staff operasional",
        description: "Hak akses disesuaikan tugas sehingga proses harian lebih aman dan efisien.",
        icon: Layers,
        tag: "Custom role",
    },
];

export default function MultiCabangPage() {
    return (
        <FeatureLandingTemplate
            badgeLabel="Enterprise Ready"
            title="Multi-Cabang"
            subtitle="Satu Kendali untuk Banyak Outlet"
            description="Scale bisnis Anda dengan dashboard yang konsisten untuk seluruh cabang, lengkap dengan sinkronisasi data dan kontrol akses yang matang."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Hubungi Sales", href: "/sales" }}
            featureSection={{
                eyebrow: "Branch Operations",
                title: "Bangun sistem operasional cabang yang lebih terkoordinasi",
                description:
                    "Beres Cloud membantu owner dan tim regional memonitor performa outlet dengan ritme kerja yang sama di seluruh jaringan bisnis.",
                items: FEATURE_ITEMS,
            }}
            spotlightSection={{
                eyebrow: "Access Governance",
                title: "Kelola struktur akses sesuai organisasi bisnis Anda",
                description:
                    "Setiap level tim mendapatkan ruang kerja yang relevan, sehingga data sensitif tetap aman dan operasional tetap gesit.",
                items: SPOTLIGHT_ITEMS,
            }}
            operationsSection={{
                eyebrow: "Growth Enablement",
                title: "Tambah outlet baru tanpa menambah beban koordinasi",
                description:
                    "Gunakan sistem multi-cabang yang menjaga standar operasional tetap seragam dari cabang pertama hingga cabang berikutnya.",
                bullets: [
                    "Onboarding cabang baru menjadi lebih cepat dan terukur",
                    "Performa antar outlet bisa dipantau dengan metrik yang konsisten",
                    "Mutasi stok antarcabang berjalan dengan jejak approval jelas",
                    "Pusat tetap punya visibilitas penuh tanpa mengganggu tim lapangan",
                ],
                panelTitle: "Multi-Outlet Command Center",
                panelDescription:
                    "Panel terpusat untuk memonitor kesehatan operasional setiap cabang dalam satu tampilan yang ringkas namun informatif.",
                panelIcon: Building2,
            }}
            finalSection={{
                title: "Siap scale ke lebih banyak cabang?",
                description:
                    "Gunakan Beres Cloud untuk menjaga pertumbuhan outlet tetap rapi, terukur, dan mudah dikendalikan dari satu dashboard.",
                primaryCta: { label: "Mulai Free Trial", href: "/wishlist" },
                secondaryCta: { label: "Lihat Paket Enterprise", href: "/harga" },
            }}
        />
    );
}
