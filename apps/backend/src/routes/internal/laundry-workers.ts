import { Hono } from "hono";
import { and, asc, eq, inArray, lte, or, sql, isNull } from "drizzle-orm";
import { z } from "zod";
import { laundryNotificationOutbox } from "@beresio/db";
import { errors, ok } from "../../lib/errors";
import { internalAuthMiddleware } from "../../middleware/internal-auth";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    INTERNAL_API_SECRET?: string;
    LAUNDRY_WA_PROVIDER_URL?: string;
    LAUNDRY_WA_PROVIDER_TOKEN?: string;
    LAUNDRY_WA_TIMEOUT_MS?: string;
    LAUNDRY_WA_MAX_ATTEMPTS?: string;
    LAUNDRY_WA_RETRY_BASE_SECONDS?: string;
};
type Variables = { db: any; user: any; session: any };

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_RETRY_BASE_SECONDS = 30;
const DEFAULT_TEMPLATE =
    "Halo {{customerName}}, order {{orderNumber}} status terbaru: {{status}}. Sisa pembayaran: Rp {{remainingAmount}}.";

const dispatchSchema = z.object({
    organizationId: z.string().trim().min(1).optional(),
    branchId: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(25),
    dryRun: z.preprocess((value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") return value.toLowerCase() === "true";
        return false;
    }, z.boolean()).optional().default(false),
});

function parseNumericEnv(raw: string | undefined, fallback: number, min: number, max: number) {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function parsePayload(raw: unknown): Record<string, unknown> {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return raw as Record<string, unknown>;
}

function normalizePhone(value: unknown) {
    if (typeof value !== "string") return null;
    const digits = value.replace(/\D/g, "");
    return digits || null;
}

function renderTemplate(template: string, payload: Record<string, string>) {
    return template.replace(/\{\{(\w+)\}\}/g, (_all, key) => payload[key] ?? "");
}

function sanitizeErrorMessage(value: unknown) {
    const message = value instanceof Error ? value.message : String(value ?? "Unknown error");
    return message.slice(0, 500);
}

function nextRetryAt(attemptCount: number, retryBaseSeconds: number) {
    const delaySeconds = retryBaseSeconds * Math.pow(2, Math.max(0, attemptCount - 1));
    return new Date(Date.now() + delaySeconds * 1000);
}

async function sendWhatsapp(input: {
    providerUrl: string;
    providerToken?: string;
    timeoutMs: number;
    outboxId: string;
    to: string;
    message: string;
    metadata: Record<string, unknown>;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
        const headers: Record<string, string> = {
            "content-type": "application/json",
            "idempotency-key": `laundry-outbox-${input.outboxId}`,
        };
        if (input.providerToken) {
            headers.authorization = `Bearer ${input.providerToken}`;
        }

        const response = await fetch(input.providerUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
                channel: "whatsapp",
                to: input.to,
                message: input.message,
                metadata: input.metadata,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const responseText = await response.text().catch(() => response.statusText);
            throw new Error(`Provider responded ${response.status}: ${responseText.slice(0, 300)}`);
        }
    } finally {
        clearTimeout(timeout);
    }
}

export const internalLaundryWorkersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
internalLaundryWorkersRouter.use("*", internalAuthMiddleware);

async function runDispatch(c: any, payload: unknown) {
    const parsed = dispatchSchema.safeParse(payload ?? {});
    if (!parsed.success) {
        return errors.badRequest(c, parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const db = c.get("db");
    const { organizationId, branchId, limit, dryRun } = parsed.data;
    const providerUrl = (c.env.LAUNDRY_WA_PROVIDER_URL ?? "").trim();
    const providerToken = (c.env.LAUNDRY_WA_PROVIDER_TOKEN ?? "").trim() || undefined;
    const timeoutMs = parseNumericEnv(c.env.LAUNDRY_WA_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, 1_000, 60_000);
    const maxAttempts = parseNumericEnv(c.env.LAUNDRY_WA_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS, 1, 20);
    const retryBaseSeconds = parseNumericEnv(c.env.LAUNDRY_WA_RETRY_BASE_SECONDS, DEFAULT_RETRY_BASE_SECONDS, 5, 3_600);

    if (!dryRun && !providerUrl) {
        return c.json({
            success: false,
            error: {
                code: "OUTBOX_PROVIDER_NOT_CONFIGURED",
                message: "LAUNDRY_WA_PROVIDER_URL is required for outbox dispatch.",
            },
        }, 503);
    }

    const now = new Date();
    const conditions = [
        inArray(laundryNotificationOutbox.status, ["queued", "failed"]),
        or(isNull(laundryNotificationOutbox.nextRetryAt), lte(laundryNotificationOutbox.nextRetryAt, now)),
    ];
    if (organizationId) conditions.push(eq(laundryNotificationOutbox.organizationId, organizationId));
    if (branchId) conditions.push(eq(laundryNotificationOutbox.branchId, branchId));

    const candidates = await db
        .select({
            id: laundryNotificationOutbox.id,
            organizationId: laundryNotificationOutbox.organizationId,
            branchId: laundryNotificationOutbox.branchId,
            orderId: laundryNotificationOutbox.orderId,
            templateSnapshot: laundryNotificationOutbox.templateSnapshot,
            payload: laundryNotificationOutbox.payload,
            attemptCount: laundryNotificationOutbox.attemptCount,
        })
        .from(laundryNotificationOutbox)
        .where(and(...conditions))
        .orderBy(asc(laundryNotificationOutbox.createdAt))
        .limit(limit);

    const summary = {
        scanned: candidates.length,
        claimed: 0,
        sent: 0,
        failed: 0,
        deadLetter: 0,
        skipped: 0,
        dryRun,
        maxAttempts,
        retryBaseSeconds,
    };

    for (const candidate of candidates) {
        const [claimed] = await db
            .update(laundryNotificationOutbox)
            .set({
                status: "processing",
                attemptCount: sql`${laundryNotificationOutbox.attemptCount} + 1`,
                lastError: null,
                updatedAt: new Date(),
            })
            .where(and(
                eq(laundryNotificationOutbox.id, candidate.id),
                inArray(laundryNotificationOutbox.status, ["queued", "failed"])
            ))
            .returning({
                id: laundryNotificationOutbox.id,
                organizationId: laundryNotificationOutbox.organizationId,
                branchId: laundryNotificationOutbox.branchId,
                orderId: laundryNotificationOutbox.orderId,
                templateSnapshot: laundryNotificationOutbox.templateSnapshot,
                payload: laundryNotificationOutbox.payload,
                attemptCount: laundryNotificationOutbox.attemptCount,
            });

        if (!claimed) {
            summary.skipped += 1;
            continue;
        }

        summary.claimed += 1;

        const payloadRecord = parsePayload(claimed.payload);
        const customerPhone = normalizePhone(payloadRecord.customerPhone);
        const orderNumber = String(payloadRecord.orderNumber ?? "");
        const status = String(payloadRecord.status ?? "");
        const customerName = String(payloadRecord.customerName ?? "Pelanggan");
        const remainingAmount = String(payloadRecord.remainingAmount ?? 0);
        const message = renderTemplate(claimed.templateSnapshot ?? DEFAULT_TEMPLATE, {
            customerName,
            orderNumber,
            status,
            remainingAmount,
        });

        try {
            if (!customerPhone) {
                throw new Error("Missing customerPhone in outbox payload");
            }

            if (!dryRun) {
                await sendWhatsapp({
                    providerUrl,
                    providerToken,
                    timeoutMs,
                    outboxId: claimed.id,
                    to: customerPhone,
                    message,
                    metadata: {
                        orderId: claimed.orderId,
                        orderNumber,
                        organizationId: claimed.organizationId,
                        branchId: claimed.branchId,
                    },
                });
            }

            await db
                .update(laundryNotificationOutbox)
                .set({
                    status: "sent",
                    sentAt: new Date(),
                    nextRetryAt: null,
                    lastError: null,
                    updatedAt: new Date(),
                })
                .where(eq(laundryNotificationOutbox.id, claimed.id));

            summary.sent += 1;
        } catch (error) {
            const attemptCount = Number(claimed.attemptCount ?? Number(candidate.attemptCount ?? 0) + 1);
            const isDeadLetter = attemptCount >= maxAttempts;
            const errorMessage = sanitizeErrorMessage(error);

            await db
                .update(laundryNotificationOutbox)
                .set({
                    status: isDeadLetter ? "dead_letter" : "failed",
                    lastError: errorMessage,
                    nextRetryAt: isDeadLetter ? null : nextRetryAt(attemptCount, retryBaseSeconds),
                    updatedAt: new Date(),
                })
                .where(eq(laundryNotificationOutbox.id, claimed.id));

            if (isDeadLetter) {
                summary.deadLetter += 1;
            } else {
                summary.failed += 1;
            }
        }
    }

    return ok(c, summary);
}

internalLaundryWorkersRouter.post("/notifications/dispatch", async (c) => {
    const payload = await c.req.json().catch(() => ({}));
    return runDispatch(c, payload);
});

internalLaundryWorkersRouter.get("/notifications/dispatch", async (c) => {
    return runDispatch(c, {
        organizationId: c.req.query("organizationId") ?? undefined,
        branchId: c.req.query("branchId") ?? undefined,
        limit: c.req.query("limit") ?? undefined,
        dryRun: c.req.query("dryRun") ?? undefined,
    });
});
