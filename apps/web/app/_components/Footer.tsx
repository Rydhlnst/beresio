import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { APP_CONTENT_WIDTH } from "./layout-width";

const FOOTER_COLUMNS = [
    {
        title: "Produk",
        links: [
            { label: "Fitur POS", href: "/fitur/kasir" },
            { label: "Laporan", href: "/fitur/laporan" },
            { label: "Notifikasi WA", href: "/fitur/pengiriman" },
            { label: "Harga", href: "/harga" },
        ],
    },
    {
        title: "Solusi",
        links: [
            { label: "Restoran", href: "/solusi/fnb" },
            { label: "Retail", href: "/solusi/retail" },
            { label: "Laundry", href: "/solusi/laundry" },
            { label: "Layanan", href: "/solusi/salon" },
        ],
    },
    {
        title: "Perusahaan",
        links: [
            { label: "Tentang Kami", href: "/about" },
            { label: "Blog", href: "/blog" },
            { label: "Karir", href: "/careers" },
            { label: "Hubungi Kami", href: "/support" },
        ],
    },
] as const;

export function Footer() {
    return (
        <footer className="border-t border-border/70 bg-background pb-8 pt-12">
            <div className={APP_CONTENT_WIDTH}>
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <BrandMark textSize="md" />
                        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                            Platform manajemen bisnis untuk UKM Indonesia.
                        </p>
                        <div className="mt-4 flex items-center gap-3 text-muted-foreground">
                            <Link href="#" aria-label="Instagram" className="transition-colors hover:text-primary">
                                <Instagram className="h-4 w-4" />
                            </Link>
                            <Link href="#" aria-label="LinkedIn" className="transition-colors hover:text-primary">
                                <Linkedin className="h-4 w-4" />
                            </Link>
                            <Link href="#" aria-label="Twitter" className="transition-colors hover:text-primary">
                                <Twitter className="h-4 w-4" />
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
                    <p>&copy; 2025 Beres Cloud</p>
                    <div className="flex items-center gap-5">
                        <Link href="/privacy" className="transition-colors hover:text-foreground">
                            Kebijakan Privasi
                        </Link>
                        <Link href="/terms" className="transition-colors hover:text-foreground">
                            Syarat Penggunaan
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
