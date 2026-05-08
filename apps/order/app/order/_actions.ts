"use server";

import { z } from "zod";
import { submitPublicOrderIntake } from "@/lib/public-order-api";

const submitOrderSchema = z.object({
    tenantSlug: z.string().trim().min(1),
    branchSlug: z.string().trim().min(1),
    channel: z.enum(["whatsapp_link", "web_direct"]).default("web_direct"),
    orderType: z.enum(["pickup", "drop_off"]).default("pickup"),
    customerName: z.string().trim().min(2).max(100),
    customerPhone: z.string().trim().min(6).max(30),
    customerAddress: z.string().trim().min(5).max(500),
    pickupPreferenceAt: z.string().optional(),
    paymentPreference: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(500).optional(),
    serviceType: z.string().trim().min(1).max(50).default("laundry"),
    customFields: z.record(z.string(), z.unknown()).optional().default({}),
    consentAccepted: z.boolean(),
    honeypot: z.string().default(""),
    items: z.array(z.object({
        serviceId: z.string().trim().min(1),
        qty: z.coerce.number().positive(),
        unit: z.string().trim().min(1).max(20).default("kg"),
        lineNote: z.string().trim().max(280).optional(),
    })).min(1).max(20),
});

type SubmitOrderActionResult =
    | { ok: true; data: Awaited<ReturnType<typeof submitPublicOrderIntake>> }
    | { ok: false; error: string };

export async function submitCustomerOrderAction(
    rawInput: unknown,
    idempotencyKey: string
): Promise<SubmitOrderActionResult> {
    const parsed = submitOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
    }
    if (!idempotencyKey || !idempotencyKey.trim()) {
        return { ok: false, error: "Idempotency key kosong. Coba kirim ulang." };
    }

    try {
        const data = await submitPublicOrderIntake(parsed.data, idempotencyKey.trim());
        return { ok: true, data };
    } catch (err: any) {
        return { ok: false, error: err?.message ?? "Gagal mengirim order" };
    }
}
