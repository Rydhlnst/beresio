import { Hono } from "hono";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import {
    branches,
    customerOrderIntakeEvents,
    customerOrderIntakeItems,
    customerOrderIntakes,
    laundryServices,
    organization,
    publicOrderFunnelEvents,
    publicSubmitIdempotency,
} from "@beresio/db";
import { errors, ok } from "../../lib/errors";
import { createUpstashClient } from "../../lib/realtime";
import { parseJsonRecord } from "../../lib/safe-json";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
};
type Variables = { db: any; user: any; session: any };

const IDEMPOTENCY_SCOPE = "customer_order_intake";
const PHONE_DIGITS_MIN = 8;
const PHONE_DIGITS_MAX = 15;
const COOLDOWN_SECONDS = 90;
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 20;
const DUPLICATE_WINDOW_MINUTES = 15;
const PICKUP_HORIZON_DAYS = 7;

const createOrderIntakeSchema = z.object({
    tenantSlug: z.string().trim().min(1),
    branchSlug: z.string().trim().min(1),
    channel: z.enum(["whatsapp_link", "web_direct"]).optional().default("whatsapp_link"),
    orderType: z.enum(["pickup", "drop_off"]).optional().default("pickup"),
    customerName: z.string().trim().min(2).max(100),
    customerPhone: z.string().trim().min(6).max(30),
    customerAddress: z.string().trim().min(5).max(500),
    customerAddressLabel: z.string().trim().max(120).optional().nullable(),
    customerAddressLat: z.coerce.number().min(-90).max(90).optional().nullable(),
    customerAddressLng: z.coerce.number().min(-180).max(180).optional().nullable(),
    pickupPreferenceAt: z.string().datetime().optional().nullable(),
    paymentPreference: z.string().trim().max(40).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    serviceType: z.string().trim().min(1).max(50).optional().default("laundry"),
    customFields: z.record(z.string(), z.unknown()).optional().default({}),
    consentAccepted: z.boolean(),
    honeypot: z.string().optional().default(""),
    items: z.array(z.object({
        serviceId: z.string().trim().min(1),
        qty: z.coerce.number().positive(),
        unit: z.string().trim().min(1).max(20).optional().default("kg"),
        lineNote: z.string().trim().max(280).optional().nullable(),
    })).min(1).max(20),
});

const createFunnelEventSchema = z.object({
    tenantSlug: z.string().trim().min(1),
    branchSlug: z.string().trim().min(1),
    sessionId: z.string().trim().min(8).max(120),
    channel: z.enum(["whatsapp_link", "web_direct"]).optional().default("web_direct"),
    eventType: z.enum(["session_started", "session_abandoned", "session_submitted"]),
    metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

function parseMetadata(raw: string | null | undefined): Record<string, any> {
    return parseJsonRecord(raw);
}

function slugify(input: string | null | undefined) {
    const value = (input ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return value || "branch";
}

function normalizePhoneDigits(value: string | null | undefined) {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
}

function validateOperationalAddress(address: string) {
    const normalized = address.trim();
    if (normalized.length < 10) return { ok: false as const, message: "Alamat terlalu pendek" };
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length < 3) return { ok: false as const, message: "Alamat harus lebih detail" };
    if (!/\d/.test(normalized)) return { ok: false as const, message: "Alamat harus menyertakan nomor rumah/gedung" };
    return { ok: true as const };
}

async function sha256(input: string) {
    try {
        const bytes = new TextEncoder().encode(input);
        const hash = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(hash)).map((value) => value.toString(16).padStart(2, "0")).join("");
    } catch {
        return input;
    }
}

function classifyRisk(score: number): "low" | "medium" | "high" {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
}

function parseRequestIp(c: any) {
    const xForwardedFor = c.req.header("x-forwarded-for");
    if (xForwardedFor) {
        return xForwardedFor.split(",")[0]?.trim() ?? null;
    }
    return c.req.header("cf-connecting-ip")?.trim() ?? null;
}

function generateReferenceCode() {
    const date = new Date();
    const y = date.getUTCFullYear().toString().slice(-2);
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, "0");
    return `LDR-${y}${m}${d}-${random}`;
}

function buildBranchContext(rows: Array<{
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    isActive: boolean | null;
}>) {
    const slugMap = new Map<string, number>();
    return rows.map((row) => {
        const base = slugify(row.code || row.name);
        const count = slugMap.get(base) ?? 0;
        slugMap.set(base, count + 1);
        const branchSlug = count === 0 ? base : `${base}-${count + 1}`;
        return {
            id: row.id,
            name: row.name,
            code: row.code,
            address: row.address,
            phone: row.phone,
            isActive: Boolean(row.isActive ?? true),
            branchSlug,
        };
    });
}

async function resolveTenant(db: any, tenantSlug: string) {
    const [tenant] = await db
        .select({
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            logoUrl: organization.logoUrl,
            logo: organization.logo,
            metadata: organization.metadata,
            businessType: organization.businessType,
        })
        .from(organization)
        .where(eq(organization.slug, tenantSlug))
        .limit(1);

    if (!tenant || tenant.businessType !== "laundry") return null;

    const branchRows = await db
        .select({
            id: branches.id,
            name: branches.name,
            code: branches.code,
            address: branches.address,
            phone: branches.phone,
            isActive: branches.isActive,
        })
        .from(branches)
        .where(and(
            eq(branches.organizationId, tenant.id),
            eq(branches.isActive, true)
        ))
        .orderBy(asc(branches.name));

    const metadata = parseMetadata(tenant.metadata);
    const publicOrderConfig = metadata?.publicOrder ?? {};
    const description = publicOrderConfig?.description ?? metadata?.description ?? null;
    const whatsappPhone = publicOrderConfig?.whatsappPhone ?? metadata?.contact?.whatsapp ?? null;
    const normalizedBranches = buildBranchContext(branchRows);

    return {
        organizationId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        logoUrl: tenant.logoUrl ?? tenant.logo ?? null,
        description,
        whatsappPhone,
        branches: normalizedBranches,
    };
}

async function maybeRateLimitByIp(c: any, orgId: string, submitIpHash: string | null) {
    if (!submitIpHash) return null;
    const redis = createUpstashClient(c.env);
    if (!redis.enabled) return null;

    const rateKey = `public:intake:rate:${orgId}:${submitIpHash}`;
    const currentRaw = await redis.get(rateKey);
    const current = Number(currentRaw ?? 0);
    const next = Number.isFinite(current) ? current + 1 : 1;
    await redis.set(rateKey, String(next), RATE_LIMIT_WINDOW_SECONDS);
    if (next > RATE_LIMIT_MAX) {
        return c.json(
            {
                success: false,
                error: {
                    code: "RATE_LIMITED",
                    message: "Terlalu banyak submit dalam waktu singkat. Coba lagi sebentar.",
                },
            },
            429
        );
    }

    return null;
}

function buildCanonicalRequestHash(input: z.infer<typeof createOrderIntakeSchema>, phoneNormalized: string) {
    const normalizedItems = [...input.items]
        .map((item) => ({
            serviceId: item.serviceId,
            qty: Number(item.qty.toFixed(2)),
            unit: item.unit,
            lineNote: item.lineNote?.trim() ?? null,
        }))
        .sort((a, b) => `${a.serviceId}:${a.qty}`.localeCompare(`${b.serviceId}:${b.qty}`));

    return JSON.stringify({
        tenantSlug: input.tenantSlug,
        branchSlug: input.branchSlug,
        orderType: input.orderType,
        customerName: input.customerName.trim(),
        customerPhoneNormalized: phoneNormalized,
        customerAddress: input.customerAddress.trim(),
        pickupPreferenceAt: input.pickupPreferenceAt ?? null,
        paymentPreference: input.paymentPreference ?? null,
        notes: input.notes?.trim() ?? null,
        serviceType: input.serviceType,
        customFields: input.customFields ?? {},
        items: normalizedItems,
    });
}

export const publicLaundryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

publicLaundryRouter.get("/tenants/:tenantSlug", async (c) => {
    try {
        const db = c.get("db");
        const tenantSlug = c.req.param("tenantSlug");
        const tenant = await resolveTenant(db, tenantSlug);
        if (!tenant) return errors.notFound(c, "Tenant laundry tidak ditemukan");
        if (tenant.branches.length === 0) {
            return errors.notFound(c, "Tenant belum memiliki cabang aktif");
        }

        const defaultBranch = tenant.branches.length === 1 ? tenant.branches[0] : null;
        return ok(c, {
            tenant: {
                slug: tenant.tenantSlug,
                name: tenant.tenantName,
                logoUrl: tenant.logoUrl,
                description: tenant.description,
                whatsappPhone: tenant.whatsappPhone,
            },
            branchMode: tenant.branches.length > 1 ? "multi" : "single",
            defaultBranch,
            branchCount: tenant.branches.length,
        });
    } catch (err) {
        console.error("[public/laundry/tenant]", err);
        return errors.internal(c);
    }
});

publicLaundryRouter.get("/tenants/:tenantSlug/branches", async (c) => {
    try {
        const db = c.get("db");
        const tenantSlug = c.req.param("tenantSlug");
        const tenant = await resolveTenant(db, tenantSlug);
        if (!tenant) return errors.notFound(c, "Tenant laundry tidak ditemukan");

        return ok(c, {
            tenant: {
                slug: tenant.tenantSlug,
                name: tenant.tenantName,
                logoUrl: tenant.logoUrl,
                description: tenant.description,
                whatsappPhone: tenant.whatsappPhone,
            },
            branches: tenant.branches,
        });
    } catch (err) {
        console.error("[public/laundry/branches]", err);
        return errors.internal(c);
    }
});

publicLaundryRouter.get("/tenants/:tenantSlug/branches/:branchSlug/services", async (c) => {
    try {
        const db = c.get("db");
        const tenantSlug = c.req.param("tenantSlug");
        const branchSlug = c.req.param("branchSlug");
        const tenant = await resolveTenant(db, tenantSlug);
        if (!tenant) return errors.notFound(c, "Tenant laundry tidak ditemukan");

        const branch = tenant.branches.find((row) => row.branchSlug === branchSlug);
        if (!branch) return errors.notFound(c, "Cabang tidak ditemukan");

        const services = await db
            .select({
                id: laundryServices.id,
                name: laundryServices.name,
                unit: laundryServices.unit,
                basePrice: laundryServices.basePrice,
                estimatedDurationHours: laundryServices.estimatedDurationHours,
            })
            .from(laundryServices)
            .where(and(
                eq(laundryServices.organizationId, tenant.organizationId),
                eq(laundryServices.branchId, branch.id),
                eq(laundryServices.isActive, true)
            ))
            .orderBy(asc(laundryServices.name));

        return ok(c, {
            tenant: {
                slug: tenant.tenantSlug,
                name: tenant.tenantName,
                logoUrl: tenant.logoUrl,
                description: tenant.description,
                whatsappPhone: tenant.whatsappPhone,
            },
            branch,
            constraints: {
                minPhoneDigits: PHONE_DIGITS_MIN,
                maxPhoneDigits: PHONE_DIGITS_MAX,
                pickupHorizonDays: PICKUP_HORIZON_DAYS,
            },
            services,
        });
    } catch (err) {
        console.error("[public/laundry/services]", err);
        return errors.internal(c);
    }
});

publicLaundryRouter.post("/funnel-events", async (c) => {
    try {
        const db = c.get("db");
        const payload = await c.req.json().catch(() => null);
        const parsed = createFunnelEventSchema.safeParse(payload);
        if (!parsed.success) {
            return errors.badRequest(c, parsed.error.issues[0]?.message ?? "Payload tidak valid");
        }

        const tenant = await resolveTenant(db, parsed.data.tenantSlug);
        if (!tenant) return errors.notFound(c, "Tenant laundry tidak ditemukan");
        const branch = tenant.branches.find((row) => row.branchSlug === parsed.data.branchSlug);
        if (!branch) return errors.notFound(c, "Cabang tidak ditemukan");

        await db
            .insert(publicOrderFunnelEvents)
            .values({
                organizationId: tenant.organizationId,
                branchId: branch.id,
                tenantSlug: tenant.tenantSlug,
                branchSlug: branch.branchSlug,
                channel: parsed.data.channel,
                sessionId: parsed.data.sessionId,
                eventType: parsed.data.eventType,
                metadata: parsed.data.metadata ?? {},
            })
            .onConflictDoNothing({
                target: [
                    publicOrderFunnelEvents.organizationId,
                    publicOrderFunnelEvents.sessionId,
                    publicOrderFunnelEvents.eventType,
                ],
            });

        return ok(c, { accepted: true });
    } catch (err: any) {
        console.error("[public/laundry/funnel-events]", err);
        return errors.internal(c);
    }
});

publicLaundryRouter.post("/order-intakes", async (c) => {
    try {
        const db = c.get("db");
        const rawPayload = await c.req.json().catch(() => null);
        const parsed = createOrderIntakeSchema.safeParse(rawPayload);
        if (!parsed.success) {
            return errors.badRequest(c, parsed.error.issues[0]?.message ?? "Payload tidak valid");
        }

        if (!parsed.data.consentAccepted) {
            return errors.badRequest(c, "Persetujuan wajib disetujui");
        }
        if ((parsed.data.honeypot ?? "").trim().length > 0) {
            return errors.badRequest(c, "Payload tidak valid");
        }

        const idempotencyKeyRaw = c.req.header("Idempotency-Key");
        const idempotencyKey = typeof idempotencyKeyRaw === "string" ? idempotencyKeyRaw.trim() : "";
        if (!idempotencyKey) {
            return errors.badRequest(c, "Idempotency-Key header is required");
        }

        const tenant = await resolveTenant(db, parsed.data.tenantSlug);
        if (!tenant) return errors.notFound(c, "Tenant laundry tidak ditemukan");

        const branch = tenant.branches.find((row) => row.branchSlug === parsed.data.branchSlug);
        if (!branch) return errors.notFound(c, "Cabang tidak ditemukan");

        const phoneNormalized = normalizePhoneDigits(parsed.data.customerPhone);
        if (!phoneNormalized) {
            return errors.badRequest(c, "Nomor telepon harus berisi digit");
        }
        if (phoneNormalized.length < PHONE_DIGITS_MIN || phoneNormalized.length > PHONE_DIGITS_MAX) {
            return errors.badRequest(c, `Nomor telepon harus ${PHONE_DIGITS_MIN}-${PHONE_DIGITS_MAX} digit`);
        }
        const addressCheck = validateOperationalAddress(parsed.data.customerAddress);
        if (!addressCheck.ok) {
            return errors.badRequest(c, addressCheck.message);
        }

        let pickupPreferenceAt: Date | null = null;
        if (parsed.data.pickupPreferenceAt) {
            pickupPreferenceAt = new Date(parsed.data.pickupPreferenceAt);
            if (Number.isNaN(pickupPreferenceAt.getTime())) {
                return errors.badRequest(c, "pickupPreferenceAt tidak valid");
            }

            const now = Date.now();
            if (pickupPreferenceAt.getTime() < now - 60_000) {
                return errors.badRequest(c, "Waktu pickup tidak boleh di masa lalu");
            }
            const maxAllowed = now + (PICKUP_HORIZON_DAYS * 24 * 60 * 60 * 1000);
            if (pickupPreferenceAt.getTime() > maxAllowed) {
                return errors.badRequest(c, `Waktu pickup maksimal ${PICKUP_HORIZON_DAYS} hari ke depan`);
            }
        }

        const canonicalPayload = buildCanonicalRequestHash(parsed.data, phoneNormalized);
        const requestHash = await sha256(canonicalPayload);

        const [existingIdempotent] = await db
            .select({
                requestHash: publicSubmitIdempotency.requestHash,
                responseStatus: publicSubmitIdempotency.responseStatus,
                responseBody: publicSubmitIdempotency.responseBody,
            })
            .from(publicSubmitIdempotency)
            .where(and(
                eq(publicSubmitIdempotency.organizationId, tenant.organizationId),
                eq(publicSubmitIdempotency.scope, IDEMPOTENCY_SCOPE),
                eq(publicSubmitIdempotency.idempotencyKey, idempotencyKey)
            ))
            .limit(1);

        if (existingIdempotent) {
            if (
                existingIdempotent.requestHash
                && existingIdempotent.requestHash !== requestHash
            ) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: "IDEMPOTENCY_KEY_REUSED",
                            message: "Idempotency-Key sudah dipakai untuk payload berbeda",
                        },
                    },
                    409
                );
            }
            return new Response(
                JSON.stringify(existingIdempotent.responseBody ?? {}),
                {
                    status: Number(existingIdempotent.responseStatus ?? 200),
                    headers: { "content-type": "application/json" },
                }
            );
        }

        const submitIp = parseRequestIp(c);
        const submitUa = c.req.header("user-agent") ?? null;
        const submitIpHash = submitIp ? await sha256(submitIp) : null;
        const submitUaHash = submitUa ? await sha256(submitUa) : null;

        const rateLimitResult = await maybeRateLimitByIp(c, tenant.organizationId, submitIpHash);
        if (rateLimitResult) return rateLimitResult;

        const redis = createUpstashClient(c.env);
        const cooldownKey = `public:intake:cooldown:${tenant.organizationId}:${branch.id}:${phoneNormalized}`;
        if (redis.enabled) {
            const cooldownHit = await redis.get(cooldownKey);
            if (cooldownHit) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: "COOLDOWN_ACTIVE",
                            message: "Permintaan baru terlalu cepat. Coba beberapa saat lagi.",
                        },
                    },
                    429
                );
            }
        } else {
            const ninetySecondsAgo = new Date(Date.now() - (COOLDOWN_SECONDS * 1000));
            const [recentCooldown] = await db
                .select({ id: customerOrderIntakes.id })
                .from(customerOrderIntakes)
                .where(and(
                    eq(customerOrderIntakes.organizationId, tenant.organizationId),
                    eq(customerOrderIntakes.branchId, branch.id),
                    eq(customerOrderIntakes.customerPhoneNormalized, phoneNormalized),
                    gte(customerOrderIntakes.createdAt, ninetySecondsAgo)
                ))
                .limit(1);
            if (recentCooldown) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: "COOLDOWN_ACTIVE",
                            message: "Permintaan baru terlalu cepat. Coba beberapa saat lagi.",
                        },
                    },
                    429
                );
            }
        }

        const serviceIds = parsed.data.items.map((item) => item.serviceId);
        const serviceRows = await db
            .select({
                id: laundryServices.id,
                name: laundryServices.name,
                unit: laundryServices.unit,
                basePrice: laundryServices.basePrice,
            })
            .from(laundryServices)
            .where(and(
                eq(laundryServices.organizationId, tenant.organizationId),
                eq(laundryServices.branchId, branch.id),
                eq(laundryServices.isActive, true),
                inArray(laundryServices.id, serviceIds)
            ));

        const serviceMap = new Map<string, { id: string; name: string; unit: string; basePrice: number }>(
            serviceRows.map((service: any) => [service.id, service])
        );
        if (serviceMap.size !== serviceIds.length) {
            return errors.badRequest(c, "Ada layanan yang tidak tersedia untuk cabang ini");
        }

        const duplicateWindowStart = new Date(Date.now() - (DUPLICATE_WINDOW_MINUTES * 60_000));
        const recentSimilarRows = await db
            .select({
                id: customerOrderIntakes.id,
                requestHash: customerOrderIntakes.requestHash,
                notes: customerOrderIntakes.notes,
            })
            .from(customerOrderIntakes)
            .where(and(
                eq(customerOrderIntakes.organizationId, tenant.organizationId),
                eq(customerOrderIntakes.branchId, branch.id),
                eq(customerOrderIntakes.customerPhoneNormalized, phoneNormalized),
                gte(customerOrderIntakes.createdAt, duplicateWindowStart)
            ))
            .orderBy(desc(customerOrderIntakes.createdAt));

        const riskFlags: string[] = [];
        let riskScore = 0;
        const hasDuplicateHash = recentSimilarRows.some((row: any) => row.requestHash === requestHash);
        if (hasDuplicateHash) {
            riskScore += 35;
            riskFlags.push("duplicate_payload_window");
        }
        if (recentSimilarRows.length >= 2) {
            riskScore += 20;
            riskFlags.push("repeat_phone_short_window");
        }
        if ((parsed.data.notes ?? "").match(/https?:\/\/|www\.|bitcoin|crypto|pinjaman|slot|klik/i)) {
            riskScore += 25;
            riskFlags.push("notes_spam_signal");
        }
        const riskLevel = classifyRisk(riskScore);

        const normalizedItems = parsed.data.items.map((item) => {
            const service = serviceMap.get(item.serviceId)!;
            return {
                serviceId: service.id,
                serviceNameSnapshot: service.name,
                qty: Number(item.qty.toFixed(2)),
                qtyRaw: item.qty.toFixed(2),
                unit: item.unit || service.unit || "kg",
                priceSnapshot: Number(service.basePrice ?? 0),
                lineNote: item.lineNote?.trim() ?? null,
            };
        });

        const created = await db.transaction(async (tx: any) => {
            let createdIntake: {
                id: string;
                referenceCode: string;
                status: string;
                riskLevel: string;
                riskFlags: string[];
            } | null = null;

            for (let attempt = 0; attempt < 5; attempt += 1) {
                const referenceCode = generateReferenceCode();
                const [inserted] = await tx
                    .insert(customerOrderIntakes)
                    .values({
                        referenceCode,
                        organizationId: tenant.organizationId,
                        branchId: branch.id,
                        tenantSlug: tenant.tenantSlug,
                        branchSlug: branch.branchSlug,
                        channel: parsed.data.channel,
                        status: "pending_verification",
                        orderType: parsed.data.orderType,
                        customerName: parsed.data.customerName.trim(),
                        customerPhoneRaw: parsed.data.customerPhone.trim(),
                        customerPhoneNormalized: phoneNormalized,
                        customerAddress: parsed.data.customerAddress.trim(),
                        pickupPreferenceAt,
                        paymentPreference: parsed.data.paymentPreference?.trim() ?? null,
                        notes: parsed.data.notes?.trim() ?? null,
                        customFields: {
                            serviceType: parsed.data.serviceType,
                            customerAddressLabel: parsed.data.customerAddressLabel ?? null,
                            customerAddressLat: parsed.data.customerAddressLat ?? null,
                            customerAddressLng: parsed.data.customerAddressLng ?? null,
                            ...(parsed.data.customFields ?? {}),
                        },
                        consentAcceptedAt: new Date(),
                        riskScore,
                        riskLevel,
                        riskFlags,
                        idempotencyKey,
                        requestHash,
                        submitIpHash,
                        submitUserAgentHash: submitUaHash,
                    })
                    .onConflictDoNothing({
                        target: [customerOrderIntakes.organizationId, customerOrderIntakes.referenceCode],
                    })
                    .returning({
                        id: customerOrderIntakes.id,
                        referenceCode: customerOrderIntakes.referenceCode,
                        status: customerOrderIntakes.status,
                        riskLevel: customerOrderIntakes.riskLevel,
                        riskFlags: customerOrderIntakes.riskFlags,
                    });

                if (inserted) {
                    createdIntake = inserted;
                    break;
                }
            }

            if (!createdIntake) {
                throw new Error("FAILED_TO_GENERATE_REFERENCE");
            }

            await tx.insert(customerOrderIntakeItems).values(
                normalizedItems.map((item) => ({
                    intakeId: createdIntake!.id,
                    serviceId: item.serviceId,
                    serviceNameSnapshot: item.serviceNameSnapshot,
                    qty: item.qtyRaw,
                    unit: item.unit,
                    priceSnapshot: item.priceSnapshot,
                    lineNote: item.lineNote,
                }))
            );

            await tx.insert(customerOrderIntakeEvents).values({
                intakeId: createdIntake.id,
                fromStatus: null,
                toStatus: "pending_verification",
                actorType: "customer",
                actorId: null,
                note: "Submitted from public order form",
            });

            return createdIntake;
        });

        const responseBody: Record<string, unknown> = {
            success: true,
            data: {
                intakeId: created.id,
                referenceCode: created.referenceCode,
                status: created.status,
                riskLevel: created.riskLevel,
                riskFlags: created.riskFlags,
                riskNotice: created.riskLevel === "high"
                    ? "Permintaan Anda akan dicek manual oleh tim tenant sebelum diproses."
                    : null,
            },
        };

        try {
            await db.insert(publicSubmitIdempotency).values({
                organizationId: tenant.organizationId,
                scope: IDEMPOTENCY_SCOPE,
                idempotencyKey,
                requestHash,
                responseStatus: 200,
                responseBody,
            });
        } catch {
            const [winner] = await db
                .select({
                    responseStatus: publicSubmitIdempotency.responseStatus,
                    responseBody: publicSubmitIdempotency.responseBody,
                })
                .from(publicSubmitIdempotency)
                .where(and(
                    eq(publicSubmitIdempotency.organizationId, tenant.organizationId),
                    eq(publicSubmitIdempotency.scope, IDEMPOTENCY_SCOPE),
                    eq(publicSubmitIdempotency.idempotencyKey, idempotencyKey)
                ))
                .limit(1);
            if (winner) {
                return new Response(
                    JSON.stringify(winner.responseBody ?? {}),
                    {
                        status: Number(winner.responseStatus ?? 200),
                        headers: { "content-type": "application/json" },
                    }
                );
            }
        }

        if (redis.enabled) {
            await redis.set(cooldownKey, created.id, COOLDOWN_SECONDS);
        }

        return c.json(responseBody, 200);
    } catch (err) {
        console.error("[public/laundry/order-intakes]", err);
        return errors.internal(c);
    }
});

publicLaundryRouter.get("/order-intakes/:referenceCode", async (c) => {
    try {
        const db = c.get("db");
        const referenceCode = c.req.param("referenceCode");
        const [row] = await db
            .select({
                id: customerOrderIntakes.id,
                referenceCode: customerOrderIntakes.referenceCode,
                status: customerOrderIntakes.status,
                riskLevel: customerOrderIntakes.riskLevel,
                riskFlags: customerOrderIntakes.riskFlags,
                customerName: customerOrderIntakes.customerName,
                branchId: customerOrderIntakes.branchId,
                branchName: branches.name,
                tenantSlug: customerOrderIntakes.tenantSlug,
                branchSlug: customerOrderIntakes.branchSlug,
                createdAt: customerOrderIntakes.createdAt,
                verifiedAt: customerOrderIntakes.verifiedAt,
            })
            .from(customerOrderIntakes)
            .leftJoin(branches, eq(customerOrderIntakes.branchId, branches.id))
            .where(eq(customerOrderIntakes.referenceCode, referenceCode))
            .orderBy(desc(customerOrderIntakes.createdAt))
            .limit(1);

        if (!row) return errors.notFound(c, "Referensi order tidak ditemukan");

        return ok(c, row);
    } catch (err) {
        console.error("[public/laundry/order-intakes/:referenceCode]", err);
        return errors.internal(c);
    }
});
