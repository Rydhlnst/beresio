import type { PublicLaundryService } from "@/lib/public-order-api";

export type OrderSummaryItem = {
    serviceId: string;
    qty: number;
    unit: string;
    lineNote?: string;
};

type OrderSummaryCardProps = {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    pickupPreferenceAt: string;
    orderType: "pickup" | "drop_off";
    paymentPreference: string;
    notes: string;
    items: OrderSummaryItem[];
    services: PublicLaundryService[];
};

function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function OrderSummaryCard({
    customerName,
    customerPhone,
    customerAddress,
    pickupPreferenceAt,
    orderType,
    paymentPreference,
    notes,
    items,
    services,
}: OrderSummaryCardProps) {
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const totalAmount = items.reduce((sum, item) => {
        const service = serviceMap.get(item.serviceId);
        if (!service) return sum;
        return sum + (service.basePrice * item.qty);
    }, 0);

    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Ringkasan Order</h3>
            <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start justify-between gap-3">
                    <dt>Nama</dt>
                    <dd className="text-right text-foreground">{customerName}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <dt>No HP</dt>
                    <dd className="text-right text-foreground">{customerPhone}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <dt>Alamat</dt>
                    <dd className="text-right text-foreground">{customerAddress}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <dt>Tipe</dt>
                    <dd className="text-right text-foreground">{orderType === "drop_off" ? "Drop-off" : "Pickup"}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <dt>Preferensi pickup</dt>
                    <dd className="text-right text-foreground">{pickupPreferenceAt || "-"}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                    <dt>Metode bayar</dt>
                    <dd className="text-right text-foreground">{paymentPreference || "Bayar saat verifikasi"}</dd>
                </div>
                {notes ? (
                    <div className="flex items-start justify-between gap-3">
                        <dt>Catatan</dt>
                        <dd className="max-w-[70%] text-right text-foreground">{notes}</dd>
                    </div>
                ) : null}
            </dl>

            <div className="mt-4 rounded-xl border border-border p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Layanan</p>
                <ul className="mt-2 space-y-2">
                    {items.map((item, index) => {
                        const service = serviceMap.get(item.serviceId);
                        if (!service) return null;
                        return (
                            <li key={`${item.serviceId}-${index}`} className="text-sm text-foreground">
                                <div className="flex items-center justify-between gap-3">
                                    <span>{service.name}</span>
                                    <span>{item.qty} {item.unit}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatRupiah(service.basePrice)} / {service.unit}
                                    {item.lineNote ? ` • ${item.lineNote}` : ""}
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-foreground">
                    <span>Estimasi total</span>
                    <span>{formatRupiah(totalAmount)}</span>
                </div>
            </div>
        </section>
    );
}
