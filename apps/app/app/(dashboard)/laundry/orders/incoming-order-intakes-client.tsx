"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
    acceptLaundryOrderIntakeAction,
    rejectLaundryOrderIntakeAction,
} from "../_actions";

type IncomingOrderIntake = {
    id: string;
    referenceCode: string;
    status: string;
    orderType: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    pickupPreferenceAt: string | null;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    riskFlags: string[];
    branchName: string | null;
    notes: string | null;
    createdAt: string;
    convertedOrderId: string | null;
    verifiedAt: string | null;
};

type IncomingOrderIntakesClientProps = {
    intakes: IncomingOrderIntake[];
};

const riskBadgeClassMap: Record<IncomingOrderIntake["riskLevel"], string> = {
    low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-rose-50 text-rose-700 border-rose-200",
};

const riskLabelMap: Record<IncomingOrderIntake["riskLevel"], string> = {
    low: "Risk low",
    medium: "Needs review",
    high: "High risk",
};

function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function IncomingOrderIntakesClient({ intakes }: IncomingOrderIntakesClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [noteById, setNoteById] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const pendingIntakes = useMemo(
        () => intakes.filter((item) => item.status === "pending_verification"),
        [intakes]
    );
    const highRiskCount = useMemo(
        () => pendingIntakes.filter((item) => item.riskLevel === "high").length,
        [pendingIntakes]
    );

    const onAccept = (intakeId: string) => {
        setError(null);
        setSuccess(null);
        setActiveId(intakeId);
        const note = noteById[intakeId]?.trim() || null;

        startTransition(async () => {
            const result = await acceptLaundryOrderIntakeAction(intakeId, { note });
            if (!result.ok) {
                setError(result.error ?? "Gagal menerima order request.");
                setActiveId(null);
                return;
            }
            setSuccess(`Order request ${result.data?.intakeId ?? intakeId} berhasil dikonversi.`);
            setActiveId(null);
            router.refresh();
        });
    };

    const onReject = (intakeId: string) => {
        setError(null);
        setSuccess(null);
        setActiveId(intakeId);
        const reason = noteById[intakeId]?.trim() || "";
        if (reason.length < 3) {
            setError("Isi catatan minimal 3 karakter sebelum reject.");
            setActiveId(null);
            return;
        }

        startTransition(async () => {
            const result = await rejectLaundryOrderIntakeAction(intakeId, { reason });
            if (!result.ok) {
                setError(result.error ?? "Gagal menolak order request.");
                setActiveId(null);
                return;
            }
            setSuccess(`Order request ${result.data?.intakeId ?? intakeId} berhasil ditolak.`);
            setActiveId(null);
            router.refresh();
        });
    };

    return (
        <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Incoming Order Requests</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Request dari customer web sebelum diverifikasi ke order operasional.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {pendingIntakes.length} pending
                    </Badge>
                    <Badge
                        variant="outline"
                        className="border-rose-200 bg-rose-50 text-xs font-medium text-rose-700"
                    >
                        {highRiskCount} high risk
                    </Badge>
                </div>
            </div>

            {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    {error}
                </p>
            ) : null}
            {success ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    {success}
                </p>
            ) : null}

            {pendingIntakes.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    Tidak ada incoming order yang menunggu verifikasi.
                </p>
            ) : (
                <div className="space-y-3">
                    {pendingIntakes.map((intake) => {
                        const isProcessing = isPending && activeId === intake.id;
                        return (
                            <article key={intake.id} className="rounded-lg border p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{intake.referenceCode}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {intake.customerName} - {intake.customerPhone}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {intake.branchName ?? "-"} - masuk {formatDateTime(intake.createdAt)}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`text-[11px] font-semibold ${riskBadgeClassMap[intake.riskLevel]}`}
                                    >
                                        {riskLabelMap[intake.riskLevel]}
                                    </Badge>
                                </div>

                                <p className="mt-2 text-xs text-muted-foreground">{intake.customerAddress}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pickup: {formatDateTime(intake.pickupPreferenceAt)} - Tipe: {intake.orderType}
                                </p>
                                {intake.notes ? (
                                    <p className="mt-1 text-xs text-muted-foreground">Catatan customer: {intake.notes}</p>
                                ) : null}
                                {intake.riskFlags?.length > 0 ? (
                                    <p className="mt-1 text-xs text-amber-700">Flag: {intake.riskFlags.join(", ")}</p>
                                ) : null}

                                <div className="mt-3 space-y-2">
                                    <Input
                                        value={noteById[intake.id] ?? ""}
                                        onChange={(event) => setNoteById((prev) => ({
                                            ...prev,
                                            [intake.id]: event.target.value,
                                        }))}
                                        placeholder="Catatan verifikasi (wajib kalau reject)"
                                        className="h-9 text-xs"
                                        disabled={isPending}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            className="h-8 text-xs font-semibold"
                                            onClick={() => onAccept(intake.id)}
                                            disabled={isPending}
                                        >
                                            {isProcessing ? "Memproses..." : "Accept"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-8 border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                            onClick={() => onReject(intake.id)}
                                            disabled={isPending}
                                        >
                                            Reject
                                        </Button>
                                        {intake.convertedOrderId ? (
                                            <Button type="button" variant="outline" asChild className="h-8 text-xs font-semibold">
                                                <Link href={`/laundry/orders/${intake.convertedOrderId}`}>Lihat Order</Link>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
