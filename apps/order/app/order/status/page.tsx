import type { Metadata } from "next";
import Link from "next/link";
import { fetchPublicOrderIntakeStatus, type PublicOrderIntakeStatus } from "@/lib/public-order-api";

export const metadata: Metadata = {
    title: "Cek Status Referensi",
    description: "Validasi status order berdasarkan reference code.",
    robots: { index: false, follow: false },
};

type OrderStatusPageProps = {
    searchParams: Promise<{ reference?: string }>;
};

function StatusPill({ status }: { status: string }) {
    const classes: Record<string, string> = {
        pending_verification: "bg-amber-50 text-amber-900 border-amber-300/60",
        verified: "bg-emerald-50 text-emerald-900 border-emerald-300/60",
        rejected: "bg-rose-50 text-rose-900 border-rose-300/60",
    };

    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[status] ?? "bg-muted text-foreground border-border"}`}>
            {status}
        </span>
    );
}

function StatusCard({ data }: { data: PublicOrderIntakeStatus }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Hasil validasi referensi</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">{data.referenceCode}</h2>
            <div className="mt-3">
                <StatusPill status={data.status} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Customer</dt>
                    <dd className="text-foreground">{data.customerName}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Tenant</dt>
                    <dd className="text-foreground">{data.tenantSlug}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Cabang</dt>
                    <dd className="text-foreground">{data.branchName ?? data.branchSlug}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Risk level</dt>
                    <dd className="text-foreground">{data.riskLevel}</dd>
                </div>
            </dl>
        </div>
    );
}

export default async function OrderStatusPage({ searchParams }: OrderStatusPageProps) {
    const { reference } = await searchParams;
    const ref = reference?.trim();
    let data: PublicOrderIntakeStatus | null = null;
    let error: string | null = null;

    if (ref) {
        try {
            data = await fetchPublicOrderIntakeStatus(ref);
        } catch (err: any) {
            error = err?.message ?? "Referensi tidak ditemukan.";
        }
    }

    return (
        <main className="mx-auto min-h-screen w-full max-w-xl space-y-4 px-4 py-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h1 className="text-lg font-semibold text-foreground">Cek Status Referensi Order</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Masukkan reference code untuk memastikan order sudah tercatat dan memantau status verifikasi.
                </p>
                <form className="mt-4 flex gap-2" method="get">
                    <input
                        name="reference"
                        defaultValue={ref ?? ""}
                        placeholder="Contoh: LDR-260415-ABC123"
                        className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                    <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
                        Cari
                    </button>
                </form>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <Link href="/" className="text-primary hover:underline">Kembali ke Beres Cloud Order</Link>
                </div>
            </section>

            {error ? (
                <p className="rounded-xl border border-rose-300/60 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                    {error}
                </p>
            ) : null}

            {data ? <StatusCard data={data} /> : null}
        </main>
    );
}
