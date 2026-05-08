import Link from "next/link";
import { complianceConfig } from "@repo/ui/compliance";

export function OrderTrustNotice() {
    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Transparansi Pembayaran</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {complianceConfig.brandName} menyediakan software operasional. Pemrosesan pembayaran dilakukan melalui gateway resmi merchant
                sesuai aktivasi. Halaman ini tidak mengumpulkan data kartu secara custom.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <Link href={`${complianceConfig.canonicalDomain}/privacy`} className="text-primary hover:underline">Privacy</Link>
                <Link href={`${complianceConfig.canonicalDomain}/terms`} className="text-primary hover:underline">Terms</Link>
                <Link href={`${complianceConfig.canonicalDomain}/refund-cancellation`} className="text-primary hover:underline">Refund</Link>
                <Link href="/order/status" className="text-primary hover:underline">Cek status referensi</Link>
            </div>
        </section>
    );
}
