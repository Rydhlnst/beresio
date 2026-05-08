import Link from "next/link";

export default function HomePage() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
            <section className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Beres Cloud Order</p>
                <h1 className="mt-2 text-lg font-semibold text-foreground">Link order tidak lengkap</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Silakan buka link order dari tenant, misalnya
                    <span className="font-medium text-foreground"> /order/nama-tenant/nama-cabang</span>.
                </p>
                <Link
                    href="https://beres.cloud"
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground"
                >
                    Kembali ke Beres Cloud
                </Link>
            </section>
        </main>
    );
}
