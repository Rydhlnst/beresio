import Link from "next/link";

type TenantUnavailableStateProps = {
    title?: string;
    message?: string;
};

export function TenantUnavailableState({
    title = "Halaman order belum tersedia",
    message = "Link order ini belum aktif atau tenant tidak ditemukan. Silakan hubungi admin tenant melalui WhatsApp.",
}: TenantUnavailableStateProps) {
    return (
        <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-10">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
                <Link
                    href="/"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground"
                >
                    Kembali ke Beres Cloud
                </Link>
            </section>
        </main>
    );
}
