import Link from "next/link";

type SuccessStateProps = {
    referenceCode: string;
    status: string;
    whatsappPhone?: string | null;
};

function normalizeWhatsappUrl(phone: string | null | undefined) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}`;
}

export function SuccessState({ referenceCode, status, whatsappPhone }: SuccessStateProps) {
    const whatsappUrl = normalizeWhatsappUrl(whatsappPhone);

    return (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Order tercatat</p>
            <h2 className="mt-1 text-lg font-semibold text-emerald-900">Terima kasih, order kamu sudah masuk.</h2>
            <p className="mt-2 text-sm text-emerald-800">
                Tim tenant akan verifikasi order ini sebelum diproses.
            </p>

            <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3">
                <p className="text-xs text-muted-foreground">Nomor referensi</p>
                <p className="text-base font-semibold text-foreground">{referenceCode}</p>
                <p className="mt-1 text-xs text-muted-foreground">Status awal: {status}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {whatsappUrl ? (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white"
                    >
                        Kembali ke WhatsApp
                    </a>
                ) : null}
                <Link
                    href="/"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground"
                >
                    Selesai
                </Link>
                <Link
                    href={`/order/status?reference=${encodeURIComponent(referenceCode)}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-white px-4 text-sm font-medium text-foreground"
                >
                    Cek Status Referensi
                </Link>
            </div>
        </section>
    );
}
