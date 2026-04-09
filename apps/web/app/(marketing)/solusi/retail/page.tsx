import type { Metadata } from "next";
import {
    ArrowLeftRight,
    Barcode,
    Gift,
    Package,
    Store,
    Tag,
    Users,
} from "lucide-react";
import { IndustrySolutionTemplate } from "@/app/_components/IndustrySolutionTemplate";

export const metadata: Metadata = {
    title: "Solusi Retail - POS, Barcode & Manajemen Produk",
    description:
        "Software retail lengkap dengan barcode scanner, varian produk, retur & penukaran, membership, dan laporan penjualan terperinci.",
};

const FEATURES = [
    {
        title: "Barcode-First Checkout",
        description: "Percepat kasir dengan scanning barcode dan lookup produk instan.",
        icon: Barcode,
    },
    {
        title: "Variant & SKU Control",
        description: "Kelola ukuran, warna, dan atribut produk tanpa duplikasi stok.",
        icon: Package,
    },
    {
        title: "Return & Exchange Workflow",
        description: "Retur dan tukar barang dengan histori transaksi yang rapi.",
        icon: ArrowLeftRight,
    },
    {
        title: "Promo Rule Engine",
        description: "Jalankan flash sale, bundling, dan diskon bertingkat per segmen.",
        icon: Tag,
    },
    {
        title: "Membership Growth",
        description: "Kelola tier pelanggan, reward points, dan campaign loyalitas.",
        icon: Users,
    },
    {
        title: "Gift Card Operations",
        description: "Aktifkan gift card fisik/digital untuk akuisisi dan retensi customer.",
        icon: Gift,
    },
];

export default function RetailPage() {
    return (
        <IndustrySolutionTemplate
            dashboardVariant="retail"
            badgeLabel="Solusi Industri Retail"
            title="Operasional Retail"
            subtitle="Cepat Di Kasir, Presisi Di Stok"
            description="Beres menyatukan POS, inventory, dan promosi lintas channel agar tim toko bisa fokus jualan, bukan sibuk rekonsiliasi data setiap hari."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            heroHighlights={[
                "Checkout lebih cepat dengan barcode-centric workflow.",
                "Stok antar toko dan channel selalu sinkron real-time.",
                "Promosi bisa dieksekusi per produk, kategori, dan segmen member.",
                "Retur & exchange tidak lagi mengganggu akurasi laporan.",
            ]}
            dashboardTitle="Retail Performance Grid"
            dashboardSubtitle="Store Operations"
            dashboardWidgets={[
                { label: "Transactions", value: "1.248", change: "+14% vs minggu lalu" },
                { label: "Stock Accuracy", value: "98,7%", change: "Shrinkage menurun" },
                { label: "Member Spend", value: "Rp 412rb", change: "+22% basket size" },
            ]}
            dashboardItems={[
                { title: "SKU high-velocity size M hampir habis di outlet pusat", status: "perhatian", eta: "6 jam" },
                { title: "Promo weekend active di 12 toko", status: "stabil", eta: "Berjalan" },
                { title: "Exchange request kategori premium perlu approval", status: "prioritas", eta: "30 menit" },
            ]}
            featuresTitle="Fondasi Retail Omnichannel yang Terkontrol"
            featuresDescription="Semua titik operasional dari kasir sampai inventory dipusatkan agar keputusan harian lebih cepat dan akurat."
            features={FEATURES}
            workflowTitle="Dari Lantai Toko Sampai Backoffice, Semua Nyambung"
            workflowDescription="Setiap tim melihat angka yang sama: kasir, inventory, marketing, hingga manajer area."
            workflows={[
                {
                    title: "Checkout Discipline",
                    detail: "Percepat throughput kasir tanpa kompromi di akurasi transaksi.",
                    value: "Scan-Driven POS Flow",
                    icon: Barcode,
                },
                {
                    title: "Stock Synchronization",
                    detail: "Distribusi stok antar channel dipantau dari satu command center.",
                    value: "Unified Stock Ledger",
                    icon: Package,
                },
                {
                    title: "Customer Retention",
                    detail: "Campaign loyalty terarah berdasarkan perilaku belanja member.",
                    value: "Member Lifecycle Engine",
                    icon: Store,
                },
            ]}
            proofTitle="Dampak Nyata untuk Bisnis Retail"
            proofDescription="Dengan operasi yang sinkron, retail dapat menumbuhkan penjualan sambil menjaga margin dan akurasi stok."
            proofPoints={[
                { label: "Checkout Speed", value: "3x", description: "Proses kasir lebih cepat saat jam sibuk." },
                { label: "Stock Dispute", value: "-46%", description: "Selisih stok dan konflik data menurun." },
                { label: "Promo ROI", value: "+31%", description: "Campaign lebih terukur dan tepat sasaran." },
                { label: "Member Revenue", value: "+24%", description: "Kontribusi pelanggan loyal meningkat." },
            ]}
            closingCta={{
                title: "Siap Scale Retail Anda Dengan Data yang Bersih?",
                description: "Bangun operasi retail yang responsif untuk single store maupun multi-branch dari satu platform.",
                primaryLabel: "Mulai Free Trial",
                primaryHref: "/wishlist",
                secondaryLabel: "Lihat Solusi Salon",
                secondaryHref: "/solusi/salon",
            }}
        />
    );
}
