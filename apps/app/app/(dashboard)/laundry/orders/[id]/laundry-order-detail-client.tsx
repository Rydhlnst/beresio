"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { assignLaundryDriverAction, recordLaundryPaymentAction, updateLaundryOrderStatusAction } from "../../_actions";

type LaundryOrderDetailClientProps = {
    order: any;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

const STATUS_OPTIONS = [
    "received",
    "processing",
    "ready_for_pickup",
    "out_for_delivery",
    "completed",
    "cancelled",
];

export default function LaundryOrderDetailClient({ order }: LaundryOrderDetailClientProps) {
    const router = useRouter();
    const [status, setStatus] = useState(order.status ?? "received");
    const [statusNote, setStatusNote] = useState("");
    const [driverId, setDriverId] = useState(order.assignedDriverId ?? "");
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentNote, setPaymentNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const onUpdateStatus = () => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await updateLaundryOrderStatusAction(order.id, { status, note: statusNote || null });
            if (!result.ok) {
                setError(result.error ?? "Gagal update status.");
                return;
            }
            setSuccess("Status berhasil diperbarui.");
            router.refresh();
        });
    };

    const onAssignDriver = () => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await assignLaundryDriverAction(order.id, {
                driverId: driverId.trim() || null,
            });
            if (!result.ok) {
                setError(result.error ?? "Gagal memperbarui driver.");
                return;
            }
            setSuccess("Driver berhasil diperbarui.");
            router.refresh();
        });
    };

    const onRecordPayment = () => {
        setError(null);
        setSuccess(null);
        if (paymentAmount <= 0) {
            setError("Nominal pembayaran harus lebih dari 0.");
            return;
        }

        startTransition(async () => {
            const result = await recordLaundryPaymentAction(order.id, {
                amount: paymentAmount,
                paymentMethod,
                note: paymentNote || null,
            });
            if (!result.ok) {
                setError(result.error ?? "Gagal mencatat pembayaran.");
                return;
            }
            setSuccess("Pembayaran berhasil dicatat.");
            setPaymentAmount(0);
            setPaymentNote("");
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Number</p>
                    <p className="mt-1 text-sm font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remaining</p>
                    <p className="mt-1 text-sm font-semibold">{formatCurrency(order.remainingAmount)}</p>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Update Status</h2>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={statusNote}
                        onChange={(event) => setStatusNote(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        placeholder="Catatan status (opsional)"
                    />
                    <Button className="h-9 text-xs font-semibold" onClick={onUpdateStatus} disabled={isPending}>
                        Simpan Status
                    </Button>
                </div>

                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Assign Driver</h2>
                    <p className="text-xs text-muted-foreground">
                        Driver name akan di-derive otomatis dari profile user.
                    </p>
                    <input
                        type="text"
                        value={driverId}
                        onChange={(event) => setDriverId(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        placeholder="Driver User ID"
                    />
                    <Button className="h-9 text-xs font-semibold" onClick={onAssignDriver} disabled={isPending}>
                        Simpan Driver
                    </Button>
                </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-card p-4">
                <h2 className="text-sm font-semibold">Catat Pembayaran</h2>
                <div className="grid gap-3 md:grid-cols-3">
                    <input
                        type="number"
                        min={1}
                        value={paymentAmount || ""}
                        onChange={(event) => setPaymentAmount(Number(event.target.value || 0))}
                        className="h-9 rounded-md border px-3 text-sm"
                        placeholder="Nominal"
                    />
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
                    <input
                        type="text"
                        value={paymentNote}
                        onChange={(event) => setPaymentNote(event.target.value)}
                        className="h-9 rounded-md border px-3 text-sm"
                        placeholder="Catatan pembayaran"
                    />
                </div>
                <Button className="h-9 text-xs font-semibold" onClick={onRecordPayment} disabled={isPending}>
                    Simpan Pembayaran
                </Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Item Order</h2>
                    {order.items?.length ? (
                        order.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium">{item.serviceName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.quantity} x {formatCurrency(item.unitPrice)}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold">{formatCurrency(item.lineTotal)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Belum ada item.</p>
                    )}
                </div>

                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Riwayat Pembayaran</h2>
                    {order.payments?.length ? (
                        order.payments.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium">{payment.paymentMethod ?? "manual"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(payment.createdAt).toLocaleString("id-ID")}
                                    </p>
                                </div>
                                <p className="text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>
                    )}
                </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-card p-4">
                <h2 className="text-sm font-semibold">Timeline Status</h2>
                {order.timeline?.length ? (
                    order.timeline.map((event: any) => (
                        <div key={event.id} className="rounded-lg border px-3 py-2">
                            <p className="text-sm font-medium">{event.toStatus}</p>
                            <p className="text-xs text-muted-foreground">
                                {new Date(event.createdAt).toLocaleString("id-ID")} {event.note ? `• ${event.note}` : ""}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">Belum ada perubahan status.</p>
                )}
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}
        </div>
    );
}
