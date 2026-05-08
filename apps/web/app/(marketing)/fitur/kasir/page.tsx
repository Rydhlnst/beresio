import type { Metadata } from "next";
import {
    CreditCard,
    Printer,
    Receipt,
    ScanLine,
    ShoppingCart,
    Smartphone,
    Zap,
} from "lucide-react";
import { FeatureLandingTemplate } from "../_components/FeatureLandingTemplate";

export const metadata: Metadata = {
    title: "Kasir Digital (POS) - Transaksi Cepat & Multi-Payment",
    description:
        "Kasir digital Beres Cloud mendukung multi-payment, cetak struk otomatis, dan integrasi QRIS. Transaksi lebih cepat dengan antarmuka yang intuitif.",
};

const FEATURE_ITEMS = [
    {
        title: "Multi-Payment dalam satu layar",
        description:
            "Terima tunai, transfer, QRIS, dan kartu tanpa pindah aplikasi. Semua tercatat otomatis untuk laporan harian.",
        icon: CreditCard,
    },
    {
        title: "Struk instan fisik atau digital",
        description:
            "Cetak thermal receipt langsung dari kasir, atau kirim struk digital ke pelanggan dalam hitungan detik.",
        icon: Printer,
    },
    {
        title: "Mode offline yang tetap aman",
        description:
            "Transaksi tetap berjalan saat internet tidak stabil, lalu sinkron kembali ketika koneksi sudah normal.",
        icon: Zap,
    },
    {
        title: "Split bill cepat untuk grup",
        description:
            "Pisahkan tagihan pelanggan tanpa hitung manual agar antrian kasir tetap lancar di jam ramai.",
        icon: Receipt,
    },
    {
        title: "Kasir mobile siap pakai",
        description:
            "Gunakan tablet atau smartphone sebagai POS dengan performa yang tetap responsif untuk operasional harian.",
        icon: Smartphone,
    },
    {
        title: "Ringkasan transaksi real-time",
        description:
            "Lihat penjualan, item terlaris, dan performa kasir langsung dari dashboard tanpa menunggu tutup toko.",
        icon: ShoppingCart,
    },
];

const SPOTLIGHT_ITEMS = [
    {
        title: "Input produk",
        description: "Scan barcode atau pilih item dari katalog dalam satu alur yang ringkas.",
        icon: ScanLine,
        tag: "Langkah 1",
    },
    {
        title: "Metode pembayaran",
        description: "Kasir tinggal pilih metode bayar, lalu sistem otomatis hitung total dan diskon.",
        icon: CreditCard,
        tag: "Langkah 2",
    },
    {
        title: "Konfirmasi transaksi",
        description: "Review cepat sebelum submit agar akurasi nominal dan item tetap terjaga.",
        icon: Receipt,
        tag: "Langkah 3",
    },
    {
        title: "Penerbitan struk",
        description: "Struk langsung dicetak atau dikirim digital tanpa menghambat antrian berikutnya.",
        icon: Printer,
        tag: "Langkah 4",
    },
];

export default function KasirPage() {
    return (
        <FeatureLandingTemplate
            badgeLabel="Fitur Kasir Beres Cloud"
            title="Kasir Digital"
            subtitle="Cepat, Stabil, dan Siap untuk Jam Sibuk"
            description="Rancang pengalaman transaksi yang lebih cepat untuk tim kasir Anda, dengan alur yang konsisten dari scan produk sampai struk keluar."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            featureSection={{
                eyebrow: "POS Core",
                title: "Semua kebutuhan transaksi dalam satu sistem kasir",
                description:
                    "Beres Cloud menyatukan pembayaran, struk, dan kontrol operasional kasir tanpa layar yang membingungkan.",
                items: FEATURE_ITEMS,
            }}
            spotlightSection={{
                eyebrow: "Alur Kasir",
                title: "Empat langkah yang menjaga kecepatan pelayanan",
                description:
                    "Semua staf bisa mengikuti alur yang sama sehingga onboarding lebih cepat dan kualitas layanan tetap konsisten.",
                items: SPOTLIGHT_ITEMS,
            }}
            operationsSection={{
                eyebrow: "Operasional Harian",
                title: "Bantu tim frontliner tetap fokus ke pelanggan",
                description:
                    "Gunakan alur transaksi yang lebih rapi agar proses checkout tidak memakan waktu, bahkan saat volume pelanggan meningkat.",
                bullets: [
                    "Checkout lebih singkat karena alur input produk lebih jelas",
                    "Setiap metode pembayaran langsung tercatat ke laporan",
                    "Antrian kasir lebih tertib dengan split bill yang cepat",
                    "Owner bisa cek performa kasir harian tanpa rekap manual",
                ],
                panelTitle: "POS Workspace",
                panelDescription:
                    "Dashboard kasir dirancang untuk eksekusi cepat, dengan fokus pada tombol aksi utama dan status transaksi yang mudah dipantau.",
                panelIcon: ShoppingCart,
            }}
            finalSection={{
                title: "Siap percepat transaksi di outlet Anda?",
                description:
                    "Aktifkan kasir digital Beres Cloud dan jalankan operasional checkout dengan ritme yang lebih stabil setiap hari.",
                primaryCta: { label: "Mulai Free Trial", href: "/wishlist" },
                secondaryCta: { label: "Lihat Paket Harga", href: "/harga" },
            }}
        />
    );
}
