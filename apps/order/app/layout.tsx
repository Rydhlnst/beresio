import type { Metadata, Viewport } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import "./globals.css";

const dmSans = localFont({
    src: "./fonts/GeistVF.woff",
    display: "swap",
});

export const viewport: Viewport = {
    themeColor: "#EE4822",
    width: "device-width",
    initialScale: 1,
};

export const metadata: Metadata = {
    title: {
        default: `${complianceConfig.brandName} Order`,
        template: `%s | ${complianceConfig.brandName} Order`,
    },
    description: "Customer order interface untuk tenant Beres Cloud.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body className={`${dmSans.className} bg-background text-foreground`}>
                {children}
                <footer className="border-t border-border/70 bg-background/95 px-4 py-4 text-xs text-muted-foreground">
                    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
                        <p className="font-semibold text-foreground">{complianceConfig.legalEntityName}</p>
                        <p>{complianceConfig.businessAddress}</p>
                        <div className="flex flex-wrap gap-3">
                            <Link href={`${complianceConfig.canonicalDomain}/privacy`} className="text-primary hover:underline">Privacy</Link>
                            <Link href={`${complianceConfig.canonicalDomain}/terms`} className="text-primary hover:underline">Terms</Link>
                            <Link href={`${complianceConfig.canonicalDomain}/refund-cancellation`} className="text-primary hover:underline">Refund</Link>
                            <Link href={`${complianceConfig.canonicalDomain}/support`} className="text-primary hover:underline">Support</Link>
                            <Link href="/order/status" className="text-primary hover:underline">Cek Status Order</Link>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link href={buildWhatsAppUrl(complianceConfig.supportWhatsApp)} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                WhatsApp: {complianceConfig.supportWhatsApp}
                            </Link>
                            <Link href={buildMailtoUrl(complianceConfig.supportEmail, "Beres Cloud Order Support")} className="text-primary hover:underline">
                                {complianceConfig.supportEmail}
                            </Link>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
