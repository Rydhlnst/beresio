"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { createLaundryOrderAction } from "../../_actions";

type Branch = { id: string; name: string };
type Service = {
    id: string;
    branchId: string;
    name: string;
    unit: string;
    basePrice: number;
    estimatedDurationHours: number;
    isActive: boolean;
};
type Customer = { id: string; name: string; phone?: string | null; address?: string | null };

type ItemDraft = {
    serviceId: string;
    quantity: number;
    customName: string;
};

type LaundryOrderNewFormProps = {
    branches: Branch[];
    services: Service[];
    customers: Customer[];
};

export default function LaundryOrderNewForm({ branches, services, customers }: LaundryOrderNewFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
    const [orderType, setOrderType] = useState<"walk_in">("walk_in");
    const [customerId, setCustomerId] = useState<string>("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [paymentTiming, setPaymentTiming] = useState<"pay_now" | "pay_later">("pay_later");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<ItemDraft[]>([{ serviceId: "", quantity: 1, customName: "" }]);

    const branchServices = useMemo(
        () => services.filter((item) => item.branchId === branchId && item.isActive),
        [services, branchId]
    );

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const normalizedItems = items
            .map((item) => {
                const service = branchServices.find((svc) => svc.id === item.serviceId);
                if (!service && !item.customName.trim()) return null;
                return {
                    serviceId: service?.id,
                    name: service ? undefined : item.customName.trim(),
                    quantity: item.quantity,
                    unitPrice: service?.basePrice,
                    estimatedDurationHours: service?.estimatedDurationHours,
                };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item));

        if (!branchId) {
            setError("Cabang wajib dipilih.");
            return;
        }
        if (normalizedItems.length === 0) {
            setError("Minimal satu item order wajib diisi.");
            return;
        }

        const calculatedTotalAmount = Math.max(
            0,
            Math.round(
                normalizedItems.reduce((sum, item) => {
                    return sum + item.quantity * (item.unitPrice ?? 0);
                }, 0)
            )
        );
        const initialPaymentAmount = paymentTiming === "pay_now" ? calculatedTotalAmount : 0;
        const submittedPaymentMethod = paymentTiming === "pay_now" ? paymentMethod : null;

        startTransition(async () => {
            const result = await createLaundryOrderAction({
                branchId,
                orderType,
                customerId: customerId || null,
                customerName: customerName || null,
                customerPhone: customerPhone || null,
                customerAddress: customerAddress || null,
                notes: notes || null,
                initialPaymentAmount,
                paymentMethod: submittedPaymentMethod,
                items: normalizedItems,
            });

            if (!result.ok) {
                setError(result.error ?? "Gagal membuat order.");
                return;
            }

            const orderId = (result.data as { id?: string } | undefined)?.id;
            if (orderId) {
                router.push(`/laundry/orders/${orderId}`);
                return;
            }
            router.push("/laundry/orders");
        });
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="rounded-xl border bg-card p-4">
                <h2 className="text-sm font-semibold">Informasi Order</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <select
                        value={branchId}
                        onChange={(event) => setBranchId(event.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={orderType}
                        onChange={(event) => setOrderType(event.target.value as "walk_in")}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="walk_in">Walk-in</option>
                    </select>
                    <select
                        value={customerId}
                        onChange={(event) => setCustomerId(event.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    >
                        <option value="">Tanpa customer terdaftar</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <input
                        type="text"
                        placeholder="Nama pelanggan (opsional)"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="No. telepon (opsional)"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Alamat (opsional)"
                        value={customerAddress}
                        onChange={(event) => setCustomerAddress(event.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                    />
                </div>
                <textarea
                    placeholder="Catatan order"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-3 min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    Pickup/Drop-off eksternal wajib masuk melalui form customer (order intake), bukan create manual.
                </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Item Laundry</h2>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setItems((prev) => [...prev, { serviceId: "", quantity: 1, customName: "" }])}
                    >
                        Tambah Item
                    </Button>
                </div>

                <div className="mt-4 space-y-3">
                    {items.map((item, index) => (
                        <div key={`${index}-${item.serviceId}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-4">
                            <select
                                value={item.serviceId}
                                onChange={(event) => {
                                    const next = [...items];
                                    const current = next[index] ?? { serviceId: "", quantity: 1, customName: "" };
                                    next[index] = { ...current, serviceId: event.target.value };
                                    setItems(next);
                                }}
                                className="h-9 rounded-md border px-3 text-sm"
                            >
                                <option value="">Pilih layanan</option>
                                {branchServices.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} - Rp {service.basePrice.toLocaleString("id-ID")} / {service.unit}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min={0.1}
                                step={0.1}
                                value={item.quantity}
                                onChange={(event) => {
                                    const next = [...items];
                                    const current = next[index] ?? { serviceId: "", quantity: 1, customName: "" };
                                    next[index] = { ...current, quantity: Number(event.target.value || 0) };
                                    setItems(next);
                                }}
                                className="h-9 rounded-md border px-3 text-sm"
                                placeholder="Qty"
                            />
                            <input
                                type="text"
                                placeholder="Nama custom (tanpa service)"
                                value={item.customName}
                                onChange={(event) => {
                                    const next = [...items];
                                    const current = next[index] ?? { serviceId: "", quantity: 1, customName: "" };
                                    next[index] = { ...current, customName: event.target.value };
                                    setItems(next);
                                }}
                                className="h-9 rounded-md border px-3 text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 text-xs"
                                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                                disabled={items.length === 1}
                            >
                                Hapus
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4">
                <h2 className="text-sm font-semibold">Pembayaran</h2>
                <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="radio"
                            name="paymentTiming"
                            value="pay_now"
                            checked={paymentTiming === "pay_now"}
                            onChange={() => setPaymentTiming("pay_now")}
                        />
                        <span>Bayar langsung</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="radio"
                            name="paymentTiming"
                            value="pay_later"
                            checked={paymentTiming === "pay_later"}
                            onChange={() => setPaymentTiming("pay_later")}
                        />
                        <span>Bayar nanti</span>
                    </label>
                </div>

                {paymentTiming === "pay_now" ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <p className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
                            Nominal dibayar saat ini: total order (langsung lunas)
                        </p>
                        <select
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(event.target.value)}
                            className="h-9 rounded-md border px-3 text-sm"
                        >
                            <option value="cash">Cash</option>
                            <option value="transfer">Transfer</option>
                            <option value="qris">QRIS</option>
                            <option value="card">Card</option>
                        </select>
                    </div>
                ) : null}
                {paymentTiming === "pay_later" ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                        Order dibuat tanpa pembayaran awal. Pembayaran bisa dicatat nanti di detail order.
                    </p>
                ) : null}
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <div className="flex gap-2">
                <Button type="submit" className="h-9 text-xs font-semibold" disabled={isPending}>
                    {isPending ? "Menyimpan..." : "Simpan Order"}
                </Button>
                <Button asChild type="button" variant="outline" className="h-9 text-xs font-semibold">
                    <Link href="/laundry/orders">Batal</Link>
                </Button>
            </div>
        </form>
    );
}
