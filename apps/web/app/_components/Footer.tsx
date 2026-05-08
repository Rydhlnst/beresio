import Link from "next/link";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import { BrandMark } from "./BrandMark";
import { APP_CONTENT_WIDTH } from "./layout-width";

const FOOTER_COLUMNS = [
    {
        title: "Produk",
        links: [
            { label: "Fitur POS", href: "/fitur/kasir" },
            { label: "Harga", href: "/harga" },
            // { label: "Checkout Demo", href: "/billing/checkout" },
            { label: "Status Pembayaran Demo", href: "/billing/status/INV-DEMO-240415" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Syarat Penggunaan", href: "/terms" },
            { label: "Kebijakan Privasi", href: "/privacy" },
            { label: "Refund & Pembatalan", href: "/refund-cancellation" },
            { label: "Pusat Bantuan", href: "/support" },
        ],
    },
    {
        title: "Transaksi",
        links: [
            { label: "Cara Kerja Pembayaran", href: "/billing/checkout#provider-mapping" },
            { label: "Hubungi Sales", href: "/sales" },
            { label: "Konsultasi Demo", href: "/demo" },
            { label: "Laporan Pembaruan", href: "/changelog" },
        ],
    },
] as const;

export function Footer() {
    const salesWhatsappUrl = buildWhatsAppUrl(
        complianceConfig.supportWhatsApp,
        "Halo tim Beres Cloud, saya ingin konsultasi onboarding pembayaran Midtrans/Xendit."
    );
    const supportMailtoUrl = buildMailtoUrl(
        complianceConfig.supportEmail,
        "Beres Cloud - Dukungan Operasional"
    );

    return (
        <footer className="border-t border-border/70 bg-background pb-8 pt-12">
            <div className={APP_CONTENT_WIDTH}>
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-4">
                        <BrandMark textSize="md" />
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Platform manajemen bisnis untuk UMKM Indonesia dengan alur pembayaran yang siap direview gateway.
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">{complianceConfig.legalEntityName}</p>
                            <p>{complianceConfig.businessAddress}</p>
                            <p>Jam layanan: {complianceConfig.businessHours}</p>
                            <p>Versi legal: {complianceConfig.legalVersion}</p>
                        </div>
                        <div className="flex flex-col gap-2 text-xs">
                            <Link href={supportMailtoUrl} className="text-primary hover:underline">
                                {complianceConfig.supportEmail}
                            </Link>
                            <Link href={salesWhatsappUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                WhatsApp: {complianceConfig.supportWhatsApp}
                            </Link>
                            <Link
                                href={buildMailtoUrl(complianceConfig.complaintChannel, "Beres Cloud - Pengaduan")}
                                className="text-primary hover:underline"
                            >
                                Kanal pengaduan: {complianceConfig.complaintChannel}
                            </Link>
                        </div>
                    </div>

                    {FOOTER_COLUMNS.map((column) => (
                        <div key={column.title}>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {column.title}
                            </p>
                            <ul className="mt-4 space-y-2">
                                {column.links.map((item) => (
                                    <li key={item.label}>
                                        <Link
                                            href={item.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>&copy; 2026 {complianceConfig.brandName}</p>
                    <div className="flex items-center gap-5">
                        <Link href="/privacy" className="transition-colors hover:text-foreground">
                            Kebijakan Privasi
                        </Link>
                        <Link href="/terms" className="transition-colors hover:text-foreground">
                            Syarat Penggunaan
                        </Link>
                        <Link href="/refund-cancellation" className="transition-colors hover:text-foreground">
                            Refund & Pembatalan
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
