"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button, Checkbox, Input, Label, Textarea } from "@repo/ui";
import {
    submitPublicOrderFunnelEvent,
    type PublicLaundryService,
    type PublicTenantBranch,
    type PublicTenantInfo,
} from "@/lib/public-order-api";
import { submitCustomerOrderAction } from "../_actions";
import { TenantHeader } from "./tenant-header";
import { BranchContextBar } from "./branch-context-bar";
import { OrderSummaryCard, type OrderSummaryItem } from "./order-summary-card";
import { OrderTrustNotice } from "./order-trust-notice";
import { SuccessState } from "./success-state";

type CustomerOrderPageProps = {
    tenant: PublicTenantInfo;
    branch: PublicTenantBranch;
    services: PublicLaundryService[];
};

type ServiceDraft = OrderSummaryItem;

function createIdempotencyKey() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function normalizePhoneDigits(value: string) {
    return value.replace(/\D/g, "");
}

export function CustomerOrderPage({ tenant, branch, services }: CustomerOrderPageProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isReviewStep, setIsReviewStep] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedReferenceCode, setSubmittedReferenceCode] = useState("");
    const [submittedStatus, setSubmittedStatus] = useState("");

    const [orderType, setOrderType] = useState<"pickup" | "drop_off">("pickup");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [pickupPreferenceAt, setPickupPreferenceAt] = useState("");
    const [paymentPreference, setPaymentPreference] = useState("");
    const [notes, setNotes] = useState("");
    const [consentAccepted, setConsentAccepted] = useState(false);
    const [honeypot, setHoneypot] = useState("");
    const [serviceItems, setServiceItems] = useState<ServiceDraft[]>([
        { serviceId: services[0]?.id ?? "", qty: 1, unit: services[0]?.unit ?? "kg", lineNote: "" },
    ]);
    const sessionId = useMemo(() => createIdempotencyKey(), []);
    const isSubmittedRef = useRef(false);

    const serviceMap = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);

    const phoneDigits = useMemo(() => normalizePhoneDigits(customerPhone), [customerPhone]);

    useEffect(() => {
        void submitPublicOrderFunnelEvent({
            tenantSlug: tenant.slug,
            branchSlug: branch.branchSlug,
            sessionId,
            channel: "web_direct",
            eventType: "session_started",
            metadata: { source: "website_order_form" },
        }).catch(() => undefined);

        return () => {
            if (isSubmittedRef.current) return;
            void submitPublicOrderFunnelEvent({
                tenantSlug: tenant.slug,
                branchSlug: branch.branchSlug,
                sessionId,
                channel: "web_direct",
                eventType: "session_abandoned",
                metadata: { source: "website_order_form" },
            }).catch(() => undefined);
        };
    }, [branch.branchSlug, sessionId, tenant.slug]);

    const canProceedToReview = useMemo(() => {
        if (customerName.trim().length < 2) return false;
        if (phoneDigits.length < 8 || phoneDigits.length > 15) return false;
        if (customerAddress.trim().length < 5) return false;
        if (!consentAccepted) return false;
        if (serviceItems.length === 0) return false;
        return serviceItems.every((item) => item.serviceId && item.qty > 0);
    }, [consentAccepted, customerAddress, customerName, phoneDigits, serviceItems]);

    const addServiceRow = () => {
        setServiceItems((prev) => ([
            ...prev,
            { serviceId: services[0]?.id ?? "", qty: 1, unit: services[0]?.unit ?? "kg", lineNote: "" },
        ]));
    };

    const removeServiceRow = (index: number) => {
        setServiceItems((prev) => prev.filter((_, i) => i !== index));
    };

    const updateServiceRow = (index: number, patch: Partial<ServiceDraft>) => {
        setServiceItems((prev) => prev.map((row, i) => {
            if (i !== index) return row;
            const next = { ...row, ...patch };
            if (patch.serviceId) {
                const matchedService = serviceMap.get(patch.serviceId);
                if (matchedService) {
                    next.unit = matchedService.unit;
                }
            }
            return next;
        }));
    };

    const handleSubmit = () => {
        if (!canProceedToReview) {
            setErrorMessage("Lengkapi data order dulu sebelum submit.");
            return;
        }

        setErrorMessage(null);
        const idempotencyKey = createIdempotencyKey();
        const payload = {
            tenantSlug: tenant.slug,
            branchSlug: branch.branchSlug,
            channel: "web_direct" as const,
            orderType,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerAddress: customerAddress.trim(),
            pickupPreferenceAt: pickupPreferenceAt || undefined,
            paymentPreference: paymentPreference || undefined,
            notes: notes || undefined,
            serviceType: "laundry",
            customFields: {
                source: "website_order_form",
            },
            consentAccepted,
            honeypot,
            items: serviceItems.map((item) => ({
                serviceId: item.serviceId,
                qty: item.qty,
                unit: item.unit,
                lineNote: item.lineNote?.trim() || undefined,
            })),
        };

        startTransition(async () => {
            const result = await submitCustomerOrderAction(payload, idempotencyKey);
            if (result.ok === false) {
                setErrorMessage(result.error);
                return;
            }

            setSubmittedReferenceCode(result.data.referenceCode);
            setSubmittedStatus(result.data.status);
            setIsSuccess(true);
            isSubmittedRef.current = true;
            setErrorMessage(null);
            void submitPublicOrderFunnelEvent({
                tenantSlug: tenant.slug,
                branchSlug: branch.branchSlug,
                sessionId,
                channel: "web_direct",
                eventType: "session_submitted",
                metadata: {
                    referenceCode: result.data.referenceCode,
                    riskLevel: result.data.riskLevel,
                },
            }).catch(() => undefined);
        });
    };

    if (isSuccess) {
        return (
            <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-6">
                <SuccessState
                    referenceCode={submittedReferenceCode}
                    status={submittedStatus}
                    whatsappPhone={tenant.whatsappPhone}
                />
                <div className="mt-4">
                    <OrderTrustNotice />
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto min-h-screen w-full max-w-xl space-y-4 px-4 py-5">
            <TenantHeader tenant={tenant} />
            <BranchContextBar tenantSlug={tenant.slug} branch={branch} />
            <OrderTrustNotice />
            <section className="rounded-2xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs">
                    <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-semibold ${
                            !isReviewStep ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                    >
                        1
                    </span>
                    <span className={!isReviewStep ? "font-semibold text-foreground" : "text-muted-foreground"}>Isi data</span>
                    <span className="text-muted-foreground">-</span>
                    <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-semibold ${
                            isReviewStep ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                    >
                        2
                    </span>
                    <span className={isReviewStep ? "font-semibold text-foreground" : "text-muted-foreground"}>Review & submit</span>
                </div>
            </section>

            {!isReviewStep ? (
                <section className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">Data customer</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Isi data dengan benar supaya tim tenant bisa verifikasi lebih cepat.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="block space-y-1">
                            <Label htmlFor="customer-name" className="text-xs">Nama lengkap</Label>
                            <Input
                                id="customer-name"
                                value={customerName}
                                onChange={(event) => setCustomerName(event.target.value)}
                                className="h-11 rounded-xl text-sm"
                                placeholder="Contoh: Budi Santoso"
                                autoComplete="name"
                            />
                        </label>

                        <label className="block space-y-1">
                            <Label htmlFor="customer-phone" className="text-xs">No WhatsApp / HP</Label>
                            <Input
                                id="customer-phone"
                                value={customerPhone}
                                onChange={(event) => setCustomerPhone(event.target.value)}
                                className="h-11 rounded-xl text-sm"
                                placeholder="08xxxxxxxxxx"
                                inputMode="tel"
                                autoComplete="tel"
                            />
                        </label>

                        <label className="block space-y-1">
                            <Label htmlFor="customer-address" className="text-xs">Alamat pickup/drop-off</Label>
                            <Textarea
                                id="customer-address"
                                value={customerAddress}
                                onChange={(event) => setCustomerAddress(event.target.value)}
                                className="min-h-24 rounded-xl text-sm"
                                placeholder="Tulis alamat lengkap dan patokan rumah"
                                autoComplete="street-address"
                            />
                        </label>
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setOrderType("pickup")}
                                className={`h-10 rounded-xl border text-sm font-medium ${
                                    orderType === "pickup"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border text-foreground"
                                }`}
                            >
                                Pickup
                            </button>
                            <button
                                type="button"
                                onClick={() => setOrderType("drop_off")}
                                className={`h-10 rounded-xl border text-sm font-medium ${
                                    orderType === "drop_off"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border text-foreground"
                                }`}
                            >
                                Drop-off
                            </button>
                        </div>

                        <label className="block space-y-1">
                            <Label htmlFor="pickup-preference" className="text-xs">Preferensi waktu pickup</Label>
                            <Input
                                id="pickup-preference"
                                type="datetime-local"
                                value={pickupPreferenceAt}
                                onChange={(event) => setPickupPreferenceAt(event.target.value)}
                                className="h-11 rounded-xl text-sm"
                            />
                            <span className="text-[11px] text-muted-foreground">
                                Jika kolom ini sulit dipakai di browser WhatsApp, boleh dikosongkan dulu.
                            </span>
                        </label>

                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-foreground">Preferensi pembayaran (opsional)</span>
                            <select
                                value={paymentPreference}
                                onChange={(event) => setPaymentPreference(event.target.value)}
                                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                            >
                                <option value="">Pilih nanti saat verifikasi</option>
                                <option value="cash">Cash</option>
                                <option value="transfer">Transfer</option>
                                <option value="qris">QRIS</option>
                            </select>
                        </label>
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Layanan laundry</h3>
                            <button
                                type="button"
                                onClick={addServiceRow}
                                className="text-xs font-medium text-primary"
                            >
                                + Tambah layanan
                            </button>
                        </div>

                        {serviceItems.map((item, index) => (
                            <div key={index} className="space-y-2 rounded-xl border border-border p-3">
                                <select
                                    value={item.serviceId}
                                    onChange={(event) => updateServiceRow(index, { serviceId: event.target.value })}
                                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                                >
                                    {services.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {service.name} - Rp {service.basePrice.toLocaleString("id-ID")} / {service.unit}
                                        </option>
                                    ))}
                                </select>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        value={item.qty}
                                        onChange={(event) => updateServiceRow(index, { qty: Number(event.target.value || 0) })}
                                        min={0.1}
                                        step={0.1}
                                        className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                                        placeholder="Qty"
                                    />
                                    <input
                                        value={item.unit}
                                        onChange={(event) => updateServiceRow(index, { unit: event.target.value })}
                                        className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                                        placeholder="Unit"
                                    />
                                </div>
                                <input
                                    value={item.lineNote ?? ""}
                                    onChange={(event) => updateServiceRow(index, { lineNote: event.target.value })}
                                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                                    placeholder="Catatan item (opsional)"
                                />
                                {serviceItems.length > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => removeServiceRow(index)}
                                        className="text-xs font-medium text-destructive"
                                    >
                                        Hapus layanan
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    <label className="block space-y-1 border-t border-border pt-4">
                        <span className="text-xs font-medium text-foreground">Catatan tambahan (opsional)</span>
                        <Textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            className="min-h-20 rounded-xl text-sm"
                            placeholder="Contoh: Tolong dipisah per item keluarga"
                        />
                    </label>

                    <label className="flex items-start gap-2 rounded-xl border border-border p-3">
                        <Checkbox
                            checked={consentAccepted}
                            onCheckedChange={(checked) => setConsentAccepted(Boolean(checked))}
                            className="mt-1"
                        />
                        <span className="text-xs leading-relaxed text-muted-foreground">
                            Saya setuju data ini dipakai tenant untuk proses verifikasi dan operasional order.
                        </span>
                    </label>

                    <div className="hidden">
                        <label htmlFor="website">Website</label>
                        <input
                            id="website"
                            value={honeypot}
                            onChange={(event) => setHoneypot(event.target.value)}
                            autoComplete="off"
                            tabIndex={-1}
                        />
                    </div>

                    {errorMessage ? (
                        <p
                            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                            role="alert"
                            aria-live="polite"
                        >
                            {errorMessage}
                        </p>
                    ) : null}

                    <Button
                        type="button"
                        className="h-11 w-full rounded-xl text-sm font-semibold"
                        disabled={!canProceedToReview || isPending}
                        onClick={() => {
                            if (!canProceedToReview) {
                                setErrorMessage("Lengkapi data wajib dulu sebelum lanjut ke ringkasan.");
                                return;
                            }
                            setErrorMessage(null);
                            setIsReviewStep(true);
                        }}
                    >
                        Lihat Ringkasan
                    </Button>
                </section>
            ) : (
                <section className="space-y-4">
                    <OrderSummaryCard
                        customerName={customerName.trim()}
                        customerPhone={customerPhone.trim()}
                        customerAddress={customerAddress.trim()}
                        pickupPreferenceAt={pickupPreferenceAt}
                        orderType={orderType}
                        paymentPreference={paymentPreference}
                        notes={notes}
                        items={serviceItems}
                        services={services}
                    />

                    {errorMessage ? (
                        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {errorMessage}
                        </p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl text-sm"
                            onClick={() => setIsReviewStep(false)}
                            disabled={isPending}
                        >
                            Edit Data
                        </Button>
                        <Button
                            type="button"
                            className="h-11 rounded-xl text-sm font-semibold"
                            onClick={handleSubmit}
                            disabled={isPending}
                        >
                            {isPending ? "Mengirim..." : "Kirim Order"}
                        </Button>
                    </div>
                </section>
            )}
        </main>
    );
}
