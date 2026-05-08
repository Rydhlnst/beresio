import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { complianceConfig, buildMailtoUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { generateMetadata as seoMetadata, pageKeywords } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Kebijakan Privasi",
    path: "/privacy",
    description: `${complianceConfig.brandName} menjelaskan cara pengumpulan, penggunaan, penyimpanan, dan perlindungan data pengguna secara operasional.`,
    keywords: pageKeywords.privacy,
});

const sections = [
    {
        title: "1. Data yang Kami Kumpulkan",
        items: [
            "Data akun: nama, email, nomor telepon, dan informasi organisasi.",
            "Data operasional: transaksi, katalog produk/layanan, pelanggan, serta aktivitas tim.",
            "Data teknis: alamat IP, jenis perangkat, dan log akses untuk keamanan layanan.",
        ],
    },
    {
        title: "2. Tujuan Pemrosesan",
        items: [
            "Menyediakan fitur inti platform, termasuk billing, laporan, dan manajemen operasional.",
            "Mencegah fraud, penyalahgunaan akun, dan menjaga integritas data transaksi.",
            "Menyediakan dukungan pengguna, investigasi insiden, dan pemenuhan kewajiban hukum.",
        ],
    },
    {
        title: "3. Penyimpanan dan Retensi Data",
        items: [
            "Data disimpan selama akun aktif dan selama diperlukan untuk tujuan hukum/audit.",
            "Data billing dan transaksi dapat disimpan lebih lama sesuai kewajiban perpajakan/regulasi.",
            "Permintaan penghapusan data diproses setelah verifikasi identitas dan hak kepemilikan akun.",
        ],
    },
    {
        title: "4. Berbagi Data dengan Pihak Ketiga",
        items: [
            "Kami menggunakan penyedia infrastruktur dan gateway pembayaran hanya untuk layanan yang relevan.",
            "Kami tidak menjual data pengguna.",
            "Akses pihak ketiga dibatasi berdasarkan kebutuhan operasional dan perjanjian kerahasiaan.",
        ],
    },
    {
        title: "5. Hak Pengguna",
        items: [
            "Meminta salinan data, koreksi data, dan penghapusan data sesuai ketentuan hukum.",
            "Meminta pembatasan pemrosesan tertentu untuk kasus khusus.",
            "Mengajukan komplain melalui kanal resmi yang tercantum pada halaman ini.",
        ],
    },
    {
        title: "6. Keamanan Data",
        items: [
            "Kontrol akses berbasis peran, audit log, dan pemantauan aktivitas mencurigakan.",
            "Kredensial pembayaran sensitif diproses melalui komponen hosted gateway, bukan penyimpanan manual kami.",
            "Insiden keamanan ditangani melalui prosedur respons insiden internal.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <>
            <PageHero
                badgeLabel={`Legal ${complianceConfig.legalVersion}`}
                title="Kebijakan Privasi"
                subtitle={complianceConfig.brandName}
                description="Dokumen ini menjelaskan pemrosesan data pelanggan, merchant, dan pengguna internal di Beres Cloud."
                primaryCta={{ label: "Hubungi Tim Support", href: "/support" }}
                secondaryCta={{ label: "Syarat Penggunaan", href: "/terms" }}
                align="center"
            />

            <Section>
                <div className="space-y-6 rounded-2xl border border-border/60 bg-background p-6">
                    <Heading as="h2">Informasi Legal</Heading>
                    <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <p><span className="font-semibold text-foreground">Entitas:</span> {complianceConfig.legalEntityName}</p>
                        <p><span className="font-semibold text-foreground">Berlaku sejak:</span> {complianceConfig.legalEffectiveDate}</p>
                        <p><span className="font-semibold text-foreground">Versi:</span> {complianceConfig.legalVersion}</p>
                        <p><span className="font-semibold text-foreground">Domain resmi:</span> {complianceConfig.canonicalDomain}</p>
                        <p className="sm:col-span-2"><span className="font-semibold text-foreground">Alamat:</span> {complianceConfig.businessAddress}</p>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="space-y-8">
                    {sections.map((section) => (
                        <article key={section.title} className="rounded-2xl border border-border/60 bg-background p-6">
                            <Heading as="h3" className="text-xl">{section.title}</Heading>
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
                    <Heading as="h3">Kontak Privasi & Pengaduan</Heading>
                    <p className="mt-3">Untuk pertanyaan privasi atau permintaan hak data, gunakan kanal resmi berikut:</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5">
                        <li>Email support: {complianceConfig.supportEmail}</li>
                        <li>Email pengaduan: {complianceConfig.complaintChannel}</li>
                        <li>Jam layanan: {complianceConfig.businessHours}</li>
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button asChild className="rounded-xl">
                            <Link href={buildMailtoUrl(complianceConfig.supportEmail, "Permintaan Privasi Data")}>Kirim Email Support<ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/refund-cancellation">Lihat Refund & Pembatalan</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
