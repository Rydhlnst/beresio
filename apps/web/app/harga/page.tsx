import { PageHero } from "../_components/PageHero"
import { Pricing } from "../_components/Pricing"
import { FAQ, FAQItem } from "../_components/FAQ"

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
            "Mulai dari QR statis (upload QR sendiri). Untuk Professional ke atas tersedia QR dinamis via Xendit dengan nominal otomatis.",
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
 */
export default function HargaPage() {
    return (
        <>
            <PageHero
                badgeLabel="Harga Transparan"
                title="Pilih Paket yang Cocok untuk"
                subtitle="Skala Bisnis Anda."
                description="Satu harga untuk semua cabang, tanpa biaya tersembunyi. Mulai dari Solo hingga Enterprise dengan fitur lengkap per vertical."
                primaryCta={{ label: "Mulai Free Trial", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            />
            <Pricing />
            <FAQ
                title="FAQ Harga"
                description="Jawaban cepat tentang paket, pembayaran, add-on, dan kebijakan Beres."
                badgeLabel="Harga & Berlangganan"
                categories={HARGA_CATEGORIES}
                faqs={HARGA_FAQS}
                defaultCategory="Harga & Paket"
                contactCtaLabel="Hubungi Sales"
                contactCtaHref="/sales"
            />
        </>
    )
}
