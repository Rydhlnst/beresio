import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading } from "@repo/ui";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Kebijakan Refund & Pembatalan",
    path: "/refund-cancellation",
    description:
        "Kebijakan refund dan pembatalan Beres Cloud untuk subscription SaaS, sengketa billing, dan SLA penanganan komplain.",
    keywords: ["refund beres cloud", "pembatalan langganan saas", "kebijakan billing"],
});

const policies = [
    {
        title: "1. Pembatalan Langganan",
        items: [
            "Permintaan pembatalan dapat dilakukan kapan saja oleh pemilik akun organisasi.",
            "Pembatalan berlaku di akhir periode billing aktif, kecuali ditentukan lain pada kontrak enterprise.",
            "Data akun disimpan sesuai ketentuan retensi agar pelanggan dapat melakukan ekspor.",
        ],
    },
    {
        title: "2. Kriteria Refund",
        items: [
            "Refund dipertimbangkan untuk charge duplikat atau kesalahan teknis yang tervalidasi.",
            "Permintaan refund harus diajukan maksimal 14 hari sejak tanggal transaksi.",
            "Refund di luar kriteria dapat ditolak dengan penjelasan tertulis.",
        ],
    },
    {
        title: "3. Proses Verifikasi",
        items: [
            "Tim billing akan memverifikasi nomor invoice, akun pemilik, dan kronologi kejadian.",
            "Dokumen pendukung dapat diminta untuk mempercepat validasi.",
            "Keputusan refund disampaikan melalui email resmi.",
        ],
    },
    {
        title: "4. SLA Penanganan",
        items: [
            "Respon awal komplain billing: maksimal 1 hari kerja.",
            "Keputusan final refund: maksimal 5 hari kerja setelah data lengkap.",
            "Eksekusi refund mengikuti SLA kanal pembayaran yang digunakan.",
        ],
    },
    {
        title: "5. Sengketa dan Eskalasi",
        items: [
            "Jika tidak tercapai penyelesaian awal, pengguna dapat eskalasi ke kanal pengaduan resmi.",
            "Beres Cloud mendokumentasikan seluruh proses investigasi untuk audit kepatuhan.",
            "Sengketa lanjutan mengikuti ketentuan hukum Indonesia sesuai dokumen Terms.",
        ],
    },
];

export default function RefundCancellationPage() {
    const whatsappUrl = buildWhatsAppUrl(
        complianceConfig.supportWhatsApp,
        "Halo tim Beres Cloud, saya ingin mengajukan pertanyaan refund/pembatalan."
    );

    return (
        <>
            <PageHero
                badgeLabel={`Legal ${complianceConfig.legalVersion}`}
                title="Kebijakan Refund"
                subtitle="dan Pembatalan"
                description="Dokumen ini menjelaskan hak pembatalan, proses refund, SLA, dan jalur pengaduan billing Beres Cloud."
                primaryCta={{ label: "Hubungi Billing", href: whatsappUrl }}
                secondaryCta={{ label: "Lihat Syarat Penggunaan", href: "/terms" }}
                align="center"
            />

            <Section>
                <div className="space-y-8">
                    {policies.map((policy) => (
                        <article key={policy.title} className="rounded-2xl border border-border/60 bg-background p-6">
                            <Heading as="h2" className="text-xl">{policy.title}</Heading>
                            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                {policy.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
                    <Heading as="h3">Kanal Resmi Refund & Pengaduan</Heading>
                    <ul className="mt-4 list-disc space-y-2 pl-5">
                        <li>Support billing: {complianceConfig.supportEmail}</li>
                        <li>Pengaduan kepatuhan: {complianceConfig.complaintChannel}</li>
                        <li>Jam layanan: {complianceConfig.businessHours}</li>
                        <li>Entitas: {complianceConfig.legalEntityName}</li>
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Button asChild className="rounded-xl">
                            <Link href={buildMailtoUrl(complianceConfig.supportEmail, "Permintaan Refund Beres Cloud")}>
                                Ajukan via Email
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/billing/checkout">Lihat Flow Checkout Demo</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
