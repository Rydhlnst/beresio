"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import {
    assignLaundryDriverAction,
    assignLaundryMachineAction,
    correctLaundryOrderStatusAction,
    recordLaundryPaymentAction,
    updateLaundryOrderStatusAction,
} from "../../_actions";

type LaundryOrderDetailClientProps = {
    order: any;
    drivers: Array<{ id: string; name: string; email?: string | null }>;
    machines: Array<{ id: string; code: string; name: string; status: string; isActive: boolean }>;
};

const STATUS_OPTIONS = [
    { value: "created", label: "Created" },
    { value: "confirmed", label: "Confirmed" },
    { value: "pickup_requested", label: "Pickup Requested" },
    { value: "picked_up", label: "Picked Up" },
    { value: "washing", label: "Washing" },
    { value: "drying", label: "Drying" },
    { value: "ready", label: "Ready" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

export default function LaundryOrderDetailClient({ order, drivers, machines }: LaundryOrderDetailClientProps) {
    const router = useRouter();
    const [status, setStatus] = useState(order.status ?? "created");
    const [statusNote, setStatusNote] = useState("");
    const [correctionStatus, setCorrectionStatus] = useState(order.status ?? "created");
    const [correctionReason, setCorrectionReason] = useState("");
    const [driverId, setDriverId] = useState(order.assignedDriverId ?? "");
    const [machineId, setMachineId] = useState(order.assignedMachineId ?? "");
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentNote, setPaymentNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const activeMachines = useMemo(
        () => machines.filter((machine) => machine.isActive),
        [machines]
    );

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
            setStatusNote("");
            router.refresh();
        });
    };

    const onCorrectStatus = () => {
        setError(null);
        setSuccess(null);
        if (correctionReason.trim().length < 5) {
            setError("Alasan koreksi minimal 5 karakter.");
            return;
        }
        startTransition(async () => {
            const result = await correctLaundryOrderStatusAction(order.id, {
                status: correctionStatus,
                reason: correctionReason.trim(),
            });
            if (!result.ok) {
                setError(result.error ?? "Gagal melakukan koreksi status.");
                return;
            }
            setSuccess("Koreksi status berhasil disimpan.");
            setCorrectionReason("");
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

    const onAssignMachine = () => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const result = await assignLaundryMachineAction(order.id, {
                machineId: machineId.trim() || null,
            });
            if (!result.ok) {
                setError(result.error ?? "Gagal memperbarui mesin.");
                return;
            }
            setSuccess("Mesin berhasil diperbarui.");
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
            <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Number</p>
                    <p className="mt-1 text-sm font-semibold">{order.orderNumber}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                    <p className="mt-1 text-sm font-semibold">{order.status}</p>
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
                            <option key={option.value} value={option.value}>
                                {option.label}
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
                    <h2 className="text-sm font-semibold">Status Correction (Authorized)</h2>
                    <p className="text-xs text-muted-foreground">
                        Gunakan hanya untuk memperbaiki kesalahan operasional. Alasan akan tercatat di timeline.
                    </p>
                    <select
                        value={correctionStatus}
                        onChange={(event) => setCorrectionStatus(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={correctionReason}
                        onChange={(event) => setCorrectionReason(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        placeholder="Alasan koreksi (wajib)"
                    />
                    <Button variant="outline" className="h-9 text-xs font-semibold" onClick={onCorrectStatus} disabled={isPending}>
                        Simpan Koreksi
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Assign Driver</h2>
                    <select
                        value={driverId}
                        onChange={(event) => setDriverId(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                    >
                        <option value="">Tanpa driver</option>
                        {drivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                                {driver.name} {driver.email ? `(${driver.email})` : ""}
                            </option>
                        ))}
                    </select>
                    <Button className="h-9 text-xs font-semibold" onClick={onAssignDriver} disabled={isPending}>
                        Simpan Driver
                    </Button>
                </div>

                <div className="space-y-3 rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Assign Machine</h2>
                    <select
                        value={machineId}
                        onChange={(event) => setMachineId(event.target.value)}
                        className="h-9 w-full rounded-md border px-3 text-sm"
                    >
                        <option value="">Tanpa mesin</option>
                        {activeMachines.map((machine) => (
                            <option key={machine.id} value={machine.id}>
                                {machine.code} - {machine.name} ({machine.status})
                            </option>
                        ))}
                    </select>
                    <Button className="h-9 text-xs font-semibold" onClick={onAssignMachine} disabled={isPending}>
                        Simpan Mesin
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
                        <option value="xendit">Xendit</option>
                        <option value="midtrans">Midtrans</option>
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
                                    <p className="text-sm font-medium">
                                        {(payment.paymentMethod ?? "manual").toUpperCase()} • {(payment.provider ?? "manual").toUpperCase()}
                                    </p>
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
