import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { complianceConfig, buildMailtoUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading } from "@repo/ui";
import { generateMetadata as seoMetadata, pageKeywords } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Syarat & Ketentuan Penggunaan",
    path: "/terms",
    description: `Syarat penggunaan ${complianceConfig.brandName} untuk akses layanan, pembayaran, pembatasan tanggung jawab, dan penyelesaian sengketa.`,
    keywords: pageKeywords.terms,
});

const sections = [
    {
        title: "1. Ruang Lingkup Layanan",
        items: [
            "Beres Cloud menyediakan software manajemen bisnis berbasis langganan (SaaS).",
            "Beres Cloud bukan lembaga keuangan, bukan penghimpun dana, dan bukan marketplace dana bersama tanpa penjelasan eksplisit.",
            "Fitur pembayaran menggunakan mitra gateway sesuai konfigurasi merchant dan status aktivasi akun.",
        ],
    },
    {
        title: "2. Akun dan Tanggung Jawab Pengguna",
        items: [
            "Pengguna wajib menjaga kerahasiaan kredensial dan aktivitas akun.",
            "Pengguna bertanggung jawab atas data transaksi, katalog, dan operasional yang diinput ke sistem.",
            "Pelanggaran kebijakan dapat mengakibatkan pembatasan atau penghentian akses.",
        ],
    },
    {
        title: "3. Biaya, Billing, dan Pembayaran",
        items: [
            "Biaya berlangganan mengikuti paket yang dipilih dan ditampilkan pada halaman harga/checkout.",
            "Perubahan paket dapat memicu penyesuaian prorata sesuai siklus billing.",
            "Status pembayaran (pending/paid/failed/expired) mengikuti hasil dari kanal pembayaran yang digunakan.",
        ],
    },
    {
        title: "4. Pembatalan, Refund, dan Sengketa",
        items: [
            "Ketentuan refund/pembatalan mengikuti dokumen Refund & Pembatalan yang berlaku.",
            "Permintaan refund diproses setelah verifikasi data transaksi dan kepemilikan akun.",
            "Sengketa ditangani melalui kanal pengaduan resmi sebelum eskalasi hukum lebih lanjut.",
        ],
    },
    {
        title: "5. Batasan Tanggung Jawab",
        items: [
            "Layanan disediakan sesuai kondisi operasional terbaik dengan target peningkatan berkelanjutan.",
            "Beres Cloud tidak bertanggung jawab atas kerugian akibat pelanggaran keamanan di sisi pengguna.",
            "Tanggung jawab maksimal mengikuti nilai tagihan aktif sesuai ketentuan hukum yang berlaku.",
        ],
    },
    {
        title: "6. Perubahan Dokumen",
        items: [
            "Perubahan material pada terms akan diumumkan melalui kanal resmi Beres Cloud.",
            "Versi terbaru dokumen selalu tersedia di domain resmi.",
        ],
    },
];

export default function TermsPage() {
    return (
        <>
            <PageHero
                badgeLabel={`Legal ${complianceConfig.legalVersion}`}
                title="Syarat & Ketentuan"
                subtitle={complianceConfig.brandName}
                description="Dokumen ini mengatur hak, kewajiban, dan batas tanggung jawab antara Beres Cloud dan pengguna layanan."
                primaryCta={{ label: "Lihat Kebijakan Privasi", href: "/privacy" }}
                secondaryCta={{ label: "Refund & Pembatalan", href: "/refund-cancellation" }}
                align="center"
            />

            <Section>
                <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <p><span className="font-semibold text-foreground">Entitas:</span> {complianceConfig.legalEntityName}</p>
                        <p><span className="font-semibold text-foreground">Berlaku sejak:</span> {complianceConfig.legalEffectiveDate}</p>
                        <p><span className="font-semibold text-foreground">Versi:</span> {complianceConfig.legalVersion}</p>
                        <p><span className="font-semibold text-foreground">Domain resmi:</span> {complianceConfig.canonicalDomain}</p>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="space-y-8">
                    {sections.map((section) => (
                        <article key={section.title} className="rounded-2xl border border-border/60 bg-background p-6">
                            <Heading as="h2" className="text-xl">{section.title}</Heading>
                            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                {section.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
                    <Heading as="h3">Kontak Legal</Heading>
                    <p className="mt-3">Pertanyaan legal, billing, dan pengaduan dapat disampaikan melalui kanal resmi:</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5">
                        <li>{complianceConfig.supportEmail}</li>
                        <li>{complianceConfig.complaintChannel}</li>
                        <li>{complianceConfig.businessHours}</li>
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button asChild className="rounded-xl">
                            <Link href={buildMailtoUrl(complianceConfig.complaintChannel, "Permintaan Klarifikasi Terms")}>Hubungi Tim Legal<ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/support">Hubungi Support</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
