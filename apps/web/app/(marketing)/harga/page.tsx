import type { Metadata } from "next";
import { PageHero } from "@/app/_components/PageHero"
import { Pricing } from "@/app/_components/Pricing"
import { FAQ, FAQItem } from "@/app/_components/FAQ"
import { APP_CONTENT_WIDTH } from "@/app/_components/layout-width"
import { generateMetadata as seoMetadata, pageKeywords, generateFAQSchema } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Harga Paket Software Kasir & ERP UMKM",
    path: "/harga",
    description: "Pilih paket Beres Cloud yang sesuai skala bisnis Anda. Harga transparan per organisasi, bukan per outlet. Mulai dari Solo hingga Enterprise dengan fitur lengkap.",
    keywords: pageKeywords.harga,
});

const HARGA_FAQS: FAQItem[] = [
    {
        category: "Harga & Paket",
        question: "Apakah harga berlaku per outlet atau per organisasi?",
        answer:
            "Semua paket Beres berbasis per organisasi, bukan per outlet. Jadi satu harga berlaku untuk semua cabang sesuai batas paket yang dipilih.",
    },
    {
        category: "Harga & Paket",
        question: "Apakah harga berbeda untuk tiap vertical?",
        answer:
            "Tidak. Harga berlaku untuk semua vertical. Fitur spesifik tiap vertical dijelaskan di bagian bawah halaman harga.",
    },
    {
        category: "Trial & Promo",
        question: "Apakah ada free trial?",
        answer:
            "Ada 14 hari gratis tanpa kartu kredit, dengan akses penuh fitur Professional dan data sample sesuai vertical pilihan.",
    },
    {
        category: "Trial & Promo",
        question: "Apa benefit promo launching?",
        answer:
            "50 pelanggan pertama mendapat diskon 50% untuk 3 bulan pertama + badge early adopter, serta priority feature requests.",
    },
    {
        category: "Pembayaran",
        question: "Metode pembayaran apa saja yang tersedia?",
        answer:
            "Untuk transaksi merchant harian, metode mengikuti konfigurasi gateway merchant (Midtrans). Untuk billing langganan SaaS, checkout ditampilkan pada flow subscription (Xendit sandbox/demo).",
    },
    {
        category: "Kebijakan",
        question: "Bagaimana kebijakan upgrade atau downgrade?",
        answer:
            "Upgrade aktif langsung dengan tagihan pro-rated. Downgrade berlaku di siklus berikutnya, data tetap aman.",
    },
    {
        category: "Kebijakan",
        question: "Jika saya cancel, apakah data saya hilang?",
        answer:
            "Tidak. Data tetap aman dan bisa di-export. Setelah cancel, data disimpan hingga 30 hari.",
    },
    {
        category: "Add-ons",
        question: "Apakah saya bisa menambah cabang atau user di luar paket?",
        answer:
            "Bisa. Tersedia add-on extra cabang dan extra user sesuai daftar harga add-on.",
    },
]

const HARGA_CATEGORIES = [
    "Harga & Paket",
    "Trial & Promo",
    "Pembayaran",
    "Kebijakan",
    "Add-ons",
]

/**
 * Pricing Page (Server Component)
 * Includes FAQ schema for SEO
 */
export default function HargaPage() {
    const faqSchema = generateFAQSchema(HARGA_FAQS.map(f => ({ question: f.question, answer: f.answer })));

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <PageHero
                badgeLabel="Harga Transparan"
                title="Pilih Paket yang Cocok untuk"
                subtitle="Skala Bisnis Anda."
                description="Pilih paket yang pas untuk tahap bisnis Anda, dari tim kecil sampai multi-cabang. Transparan, fleksibel, dan siap dipakai dari hari pertama."
                primaryCta={{ label: "Mulai Checkout Demo", href: "/billing/checkout" }}
                secondaryCta={{ label: "Lihat Status Pembayaran", href: "/billing/status/INV-DEMO-240415" }}
                contentClassName={APP_CONTENT_WIDTH}
            />
            <Pricing contentClassName={APP_CONTENT_WIDTH} />
            <FAQ
                title="FAQ Harga"
                description="Jawaban cepat tentang paket, pembayaran, add-on, dan kebijakan Beres."
                badgeLabel="Harga & Berlangganan"
                categories={HARGA_CATEGORIES}
                faqs={HARGA_FAQS}
                defaultCategory="Harga & Paket"
                contactCtaLabel="Hubungi Sales"
                contactCtaHref="/sales"
                contentClassName={APP_CONTENT_WIDTH}
            />
        </>
    )
}
