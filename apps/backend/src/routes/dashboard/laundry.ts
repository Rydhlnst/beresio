import { Hono } from "hono";
import { and, desc, eq, gte, gt, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
    branches,
    canTransitionLaundryOrderStatus,
    customers,
    isLaundryOrderStatus,
    laundryDomainEvents,
    laundryNotificationOutbox,
    laundryOrderItems,
    laundryOrderStatusHistory,
    laundryOrders,
    laundryPayments,
    laundryServices,
    member,
    organization,
    roles,
    user,
} from "@beresio/db";
import { authMiddleware } from "../../middleware/auth";
import { errors, ok } from "../../lib/errors";
import { getOrgId, getUserId } from "../../lib/auth-context";
import { getBranchAccessContext, hasBranchAccess } from "../../lib/branch-access";
import { requireOrganization, requirePermission } from "../../lib/permissions";
import { generateLaundryOrderNumber } from "../../lib/laundry-order-number";
import {
    getLaundryRuntimeMetrics,
    incrementLaundryOrderCreateAttempts,
    incrementLaundryValidationRejects,
} from "../../lib/laundry-metrics";
import {
    connectLaundryWebSocket,
    invalidateKpiCache,
    publishLaundryRealtime,
} from "../../lib/realtime";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    LAUNDRY_REALTIME_HUB?: any;
};
type Variables = { db: any; user: any; session: any };

type LaundryRole = "owner" | "admin" | "branch_manager" | "laundry_worker" | "cashier" | "driver";

const PRIVILEGED_STATUS_ROLE = new Set<LaundryRole>(["owner", "admin", "branch_manager", "laundry_worker"]);
const PRIVILEGED_PAYMENT_ROLE = new Set<LaundryRole>(["owner", "admin", "branch_manager", "cashier"]);
const ORG_WIDE_ROLE = new Set(["owner", "admin", "administrator", "super_admin", "org_admin"]);
const DEFAULT_ORDER_LIMIT = 50;
const PHONE_DIGITS_MIN = 8;
const PHONE_DIGITS_MAX = 15;
const LAUNDRY_OUTBOX_TRIGGER_STATUSES = new Set(["ready_for_pickup", "out_for_delivery", "completed"]);
const DEFAULT_WA_TEMPLATE =
    "Halo {{customerName}}, order {{orderNumber}} status terbaru: {{status}}. Sisa pembayaran: Rp {{remainingAmount}}.";
const LAUNDRY_DOMAIN_EVENT_TYPES = {
    ORDER_CREATED: "ORDER_CREATED",
    ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
    DRIVER_ASSIGNED: "DRIVER_ASSIGNED",
    PAYMENT_RECORDED: "PAYMENT_RECORDED",
} as const;

type LaundryDomainEventType = (typeof LAUNDRY_DOMAIN_EVENT_TYPES)[keyof typeof LAUNDRY_DOMAIN_EVENT_TYPES];

const createServiceSchema = z.object({
    branchId: z.string().trim().min(1, "branchId is required"),
    name: z.string().trim().min(1, "name is required"),
    unit: z.string().trim().min(1).max(20).optional().default("kg"),
    basePrice: z.coerce.number().int().min(0),
    estimatedDurationHours: z.coerce.number().int().min(0).optional().default(24),
    isActive: z.boolean().optional().default(true),
});

const patchServiceSchema = z.object({
    id: z.string().trim().min(1, "id is required"),
    name: z.string().trim().min(1).optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    basePrice: z.coerce.number().int().min(0).optional(),
    estimatedDurationHours: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
}).superRefine((payload, ctx) => {
    if (
        payload.name === undefined
        && payload.unit === undefined
        && payload.basePrice === undefined
        && payload.estimatedDurationHours === undefined
        && payload.isActive === undefined
    ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No changes provided", path: [] });
    }
});

const createOrderItemSchema = z.object({
    serviceId: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().positive("quantity must be > 0"),
    unitPrice: z.coerce.number().int().min(0).optional(),
    estimatedDurationHours: z.coerce.number().int().min(0).optional(),
    notes: z.string().optional().nullable(),
});

const createOrderSchema = z.object({
    branchId: z.string().trim().min(1, "branchId is required"),
    customerId: z.string().trim().min(1).optional().nullable(),
    orderType: z.enum(["walk_in", "pickup", "drop_off"]).optional().default("walk_in"),
    customerName: z.string().trim().min(1).optional().nullable(),
    customerPhone: z.string().trim().min(3).optional().nullable(),
    customerAddress: z.string().trim().min(1).optional().nullable(),
    notes: z.string().optional().nullable(),
    discountAmount: z.coerce.number().int().min(0).optional().default(0),
    taxAmount: z.coerce.number().int().min(0).optional().default(0),
    initialPaymentAmount: z.coerce.number().int().min(0).optional().default(0),
    paymentMethod: z.string().trim().min(1).optional().nullable(),
    items: z.array(createOrderItemSchema).min(1, "items are required"),
});

const patchStatusSchema = z.object({
    status: z.string().trim().min(1, "status is required"),
    note: z.string().optional().nullable(),
});

const patchDriverSchema = z.object({
    driverId: z.string().trim().min(1).nullable(),
});

const createPaymentSchema = z.object({
    amount: z.coerce.number().int().positive("amount must be > 0"),
    paymentMethod: z.string().trim().min(1).optional().nullable(),
    note: z.string().optional().nullable(),
});

const patchWaTemplateSchema = z.object({
    branchId: z.string().trim().min(1, "branchId is required"),
    template: z.string().trim().min(1, "template is required"),
});

function getValidationMessage(error: z.ZodError, fallback = "Invalid payload") {
    return error.issues[0]?.message ?? fallback;
}

function normalizeRoleList(input: unknown): string[] {
    if (typeof input !== "string") return [];
    const trimmed = input.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((v) => (typeof v === "string" ? v.toLowerCase().trim() : "")).filter(Boolean);
            }
        } catch {
            // no-op
        }
    }
    return trimmed.split(",").map((v) => v.toLowerCase().trim()).filter(Boolean);
}

function parseMetadata(raw: string | null | undefined) {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function buildDateRange(
    dateFrom?: string,
    dateTo?: string,
    options?: { defaultToToday?: boolean }
) {
    if (!dateFrom && !dateTo && options?.defaultToToday) {
        const today = new Date().toISOString().slice(0, 10);
        const from = new Date(`${today}T00:00:00.000Z`);
        const to = new Date(`${today}T23:59:59.999Z`);
        return { from, to };
    }

    let from: Date | undefined;
    let to: Date | undefined;
    if (dateFrom) {
        from = new Date(`${dateFrom}T00:00:00.000Z`);
        if (Number.isNaN(from.getTime())) return { error: "Invalid dateFrom" as const };
    }
    if (dateTo) {
        to = new Date(`${dateTo}T23:59:59.999Z`);
        if (Number.isNaN(to.getTime())) return { error: "Invalid dateTo" as const };
    }
    return { from, to };
}

function toQuantityNumber(value: unknown) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function toRoundedAmount(value: number) {
    return Math.round(value);
}

function normalizePhoneDigits(value: string | null | undefined) {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (!digits) return null;
    return digits;
}

function normalizeAddress(value: string | null | undefined) {
    if (!value) return null;
    const normalized = value.trim();
    return normalized || null;
}

function isValidOperationalPhone(phone: string | null) {
    if (!phone) return false;
    return phone.length >= PHONE_DIGITS_MIN && phone.length <= PHONE_DIGITS_MAX;
}

function logLaundryAction(input: {
    action: string;
    result: "success" | "error" | "rejected";
    orgId?: string | null;
    branchId?: string | null;
    orderId?: string | null;
    actorId?: string | null;
    reason?: string;
}) {
    console.info(JSON.stringify({
        scope: "laundry",
        action: input.action,
        result: input.result,
        orgId: input.orgId ?? null,
        branchId: input.branchId ?? null,
        orderId: input.orderId ?? null,
        actorId: input.actorId ?? null,
        reason: input.reason ?? null,
    }));
}

async function getActorRoleContext(c: any, orgId: string) {
    const db = c.get("db");
    let userId: string | null = null;
    try {
        userId = getUserId(c);
    } catch {
        userId = null;
    }
    if (!userId) return { userId: null, roles: [] as string[] };

    const [row] = await db
        .select({ roleLegacy: member.role, roleSlug: roles.slug, roleName: roles.name })
        .from(member)
        .leftJoin(roles, eq(member.roleId, roles.id))
        .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
        .limit(1);

    const roleSet = new Set<string>();
    if (row?.roleSlug) roleSet.add(row.roleSlug.toLowerCase().trim());
    if (row?.roleName) roleSet.add(row.roleName.toLowerCase().trim());
    for (const role of normalizeRoleList(row?.roleLegacy)) roleSet.add(role);
    return { userId, roles: Array.from(roleSet) };
}

async function resolveDriverAssignment(tx: any, orgId: string, driverId: string | null) {
    if (!driverId) return { driverId: null, driverName: null };

    const [driverMember] = await tx
        .select({
            userId: member.userId,
            userName: user.name,
            roleLegacy: member.role,
            roleSlug: roles.slug,
            roleName: roles.name,
        })
        .from(member)
        .innerJoin(user, eq(member.userId, user.id))
        .leftJoin(roles, eq(member.roleId, roles.id))
        .where(and(eq(member.organizationId, orgId), eq(member.userId, driverId)))
        .limit(1);

    if (!driverMember) {
        return { error: "Driver not found in organization", status: 400 as const };
    }

    const roleSet = new Set<string>();
    if (driverMember.roleSlug) roleSet.add(driverMember.roleSlug.toLowerCase().trim());
    if (driverMember.roleName) roleSet.add(driverMember.roleName.toLowerCase().trim());
    for (const role of normalizeRoleList(driverMember.roleLegacy)) roleSet.add(role);
    if (!roleSet.has("driver")) {
        return { error: "Assigned user is not a driver", status: 403 as const };
    }

    return {
        driverId: driverMember.userId,
        driverName: driverMember.userName ?? "Driver",
    };
}

function hasAnyRole(roleContext: { roles: string[] }, expected: Set<LaundryRole>) {
    return roleContext.roles.some((role) => expected.has(role as LaundryRole));
}

function ensureBranchFilter(branchIds: string[], isOrgWide: boolean, branchId?: string | null) {
    if (branchId) {
        if (!isOrgWide && !hasBranchAccess(branchIds, branchId)) {
            return { ok: false as const, message: "No access to branch" };
        }
        return { ok: true as const, effectiveBranchIds: [branchId] as string[] };
    }
    if (isOrgWide) return { ok: true as const, effectiveBranchIds: null as string[] | null };
    if (branchIds.length === 0) return { ok: false as const, message: "No branch access" };
    return { ok: true as const, effectiveBranchIds: branchIds };
}

function canRoleRecordPayment(roleContext: { roles: string[] }) {
    return hasAnyRole(roleContext, PRIVILEGED_PAYMENT_ROLE);
}

function canRoleUpdateStatus(
    roleContext: { roles: string[]; userId: string | null },
    order: { assignedDriverId: string | null },
    nextStatus: string
) {
    if (hasAnyRole(roleContext, PRIVILEGED_STATUS_ROLE)) return true;
    if (!roleContext.roles.includes("driver")) return false;
    if (!roleContext.userId || order.assignedDriverId !== roleContext.userId) return false;
    return nextStatus === "out_for_delivery" || nextStatus === "completed";
}

function canRoleAssignDriver(
    roleContext: { roles: string[]; userId: string | null },
    order: { assignedDriverId: string | null },
    payload: { driverId: string | null }
) {
    if (hasAnyRole(roleContext, new Set<LaundryRole>(["owner", "admin", "branch_manager"]))) return true;
    if (!roleContext.roles.includes("driver")) return false;
    if (!roleContext.userId) return false;

    const nextDriverId = payload.driverId;
    if (nextDriverId && nextDriverId !== roleContext.userId) return false;
    if (!nextDriverId && order.assignedDriverId && order.assignedDriverId !== roleContext.userId) return false;
    return true;
}

async function appendLaundryDomainEvent(tx: any, input: {
    orgId: string;
    branchId: string;
    orderId: string;
    eventType: LaundryDomainEventType;
    actorId: string | null;
    payload: Record<string, unknown>;
}) {
    const [event] = await tx
        .insert(laundryDomainEvents)
        .values({
            organizationId: input.orgId,
            branchId: input.branchId,
            orderId: input.orderId,
            eventType: input.eventType,
            actorId: input.actorId,
            payload: input.payload,
            occurredAt: new Date(),
        })
        .returning({
            id: laundryDomainEvents.id,
            sequence: laundryDomainEvents.sequence,
            organizationId: laundryDomainEvents.organizationId,
            branchId: laundryDomainEvents.branchId,
            orderId: laundryDomainEvents.orderId,
            eventType: laundryDomainEvents.eventType,
            occurredAt: laundryDomainEvents.occurredAt,
            payload: laundryDomainEvents.payload,
        });
    return event;
}

async function emitLaundryRealtimeEvent(c: any, event: {
    id: string;
    sequence: number;
    organizationId: string;
    branchId: string | null;
    eventType: string;
    occurredAt: Date | string;
    payload: Record<string, unknown>;
}) {
    const occurredAtDate = new Date(event.occurredAt ?? Date.now());
    const occurredAt = Number.isFinite(occurredAtDate.getTime())
        ? occurredAtDate.toISOString()
        : new Date().toISOString();

    await publishLaundryRealtime(c, {
        channel: "laundry",
        orgId: event.organizationId,
        branchId: event.branchId,
        eventId: event.id,
        sequence: Number(event.sequence ?? 0),
        eventType: event.eventType,
        occurredAt,
        payload: event.payload ?? {},
    });
}

async function resolveWaTemplate(tx: any, orgId: string, branchId: string) {
    const [orgRow] = await tx
        .select({ metadata: organization.metadata })
        .from(organization)
        .where(eq(organization.id, orgId))
        .limit(1);
    const metadata = parseMetadata(orgRow?.metadata ?? null);
    return metadata?.settings?.laundry?.waTemplates?.[branchId]
        ?? metadata?.settings?.laundry?.waTemplate
        ?? DEFAULT_WA_TEMPLATE;
}

async function enqueueLaundryNotificationOutbox(tx: any, input: {
    orgId: string;
    branchId: string;
    order: {
        id: string;
        orderNumber: string;
        status: string;
        customerName: string | null;
        customerPhone: string | null;
        remainingAmount: number;
    };
    eventId: string;
}) {
    if (!LAUNDRY_OUTBOX_TRIGGER_STATUSES.has(input.order.status)) return null;
    const template = await resolveWaTemplate(tx, input.orgId, input.branchId);
    const payload = {
        customerName: input.order.customerName ?? "Pelanggan",
        customerPhone: input.order.customerPhone,
        orderId: input.order.id,
        orderNumber: input.order.orderNumber,
        status: input.order.status,
        remainingAmount: input.order.remainingAmount,
    };

    const [outbox] = await tx
        .insert(laundryNotificationOutbox)
        .values({
            organizationId: input.orgId,
            branchId: input.branchId,
            orderId: input.order.id,
            domainEventId: input.eventId,
            channel: "whatsapp",
            status: "queued",
            templateSnapshot: template,
            payload,
            attemptCount: 0,
            nextRetryAt: new Date(),
        })
        .onConflictDoNothing({ target: [laundryNotificationOutbox.domainEventId, laundryNotificationOutbox.channel] })
        .returning({
            id: laundryNotificationOutbox.id,
            status: laundryNotificationOutbox.status,
        });
    return outbox ?? null;
}

function buildWaMessage(template: string, payload: Record<string, string>) {
    return template.replace(/\{\{(\w+)\}\}/g, (_value, key) => payload[key] ?? "");
}

export const laundryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

laundryRouter.get(
    "/services",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read", "laundry.service.manage"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");
            const isActive = c.req.query("isActive");
            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const conditions = [eq(laundryServices.organizationId, orgId)];
            if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length === 1) {
                conditions.push(eq(laundryServices.branchId, branchScope.effectiveBranchIds[0]!));
            } else if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 1) {
                conditions.push(inArray(laundryServices.branchId, branchScope.effectiveBranchIds));
            }
            if (isActive === "true") conditions.push(eq(laundryServices.isActive, true));
            if (isActive === "false") conditions.push(eq(laundryServices.isActive, false));

            const rows = await db
                .select()
                .from(laundryServices)
                .where(and(...conditions))
                .orderBy(desc(laundryServices.createdAt));

            return ok(c, rows);
        } catch (err: any) {
            console.error("[laundry/services/list]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/reports/summary",
    authMiddleware,
    requireOrganization,
    requirePermission("report.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");
            const dateFrom = c.req.query("dateFrom");
            const dateTo = c.req.query("dateTo");

            const range = buildDateRange(dateFrom, dateTo, { defaultToToday: true });
            if ("error" in range) return errors.badRequest(c, range.error);

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const paymentConditions = [eq(laundryPayments.organizationId, orgId)];
            const orderConditions = [eq(laundryOrders.organizationId, orgId)];
            if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length === 1) {
                paymentConditions.push(eq(laundryPayments.branchId, branchScope.effectiveBranchIds[0]!));
                orderConditions.push(eq(laundryOrders.branchId, branchScope.effectiveBranchIds[0]!));
            } else if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 1) {
                paymentConditions.push(inArray(laundryPayments.branchId, branchScope.effectiveBranchIds));
                orderConditions.push(inArray(laundryOrders.branchId, branchScope.effectiveBranchIds));
            }
            if (range.from) {
                paymentConditions.push(gte(laundryPayments.createdAt, range.from));
                orderConditions.push(gte(laundryOrders.createdAt, range.from));
            }
            if (range.to) {
                paymentConditions.push(lte(laundryPayments.createdAt, range.to));
                orderConditions.push(lte(laundryOrders.createdAt, range.to));
            }

            const [revenueRows, orderRows] = await Promise.all([
                db.select({ totalRevenue: sql<number>`COALESCE(SUM(${laundryPayments.amount}), 0)` })
                    .from(laundryPayments)
                    .where(and(...paymentConditions)),
                db.select({
                    totalOrders: sql<number>`COUNT(*)`,
                    completedOrders: sql<number>`COUNT(*) FILTER (WHERE ${laundryOrders.status} = 'completed')`,
                    cancelledOrders: sql<number>`COUNT(*) FILTER (WHERE ${laundryOrders.status} = 'cancelled')`,
                    outstandingAmount: sql<number>`COALESCE(SUM(${laundryOrders.remainingAmount}), 0)`,
                })
                    .from(laundryOrders)
                    .where(and(...orderConditions)),
            ]);

            const totalOrders = Number(orderRows[0]?.totalOrders ?? 0);
            const cancelledOrders = Number(orderRows[0]?.cancelledOrders ?? 0);
            const cancellationRate = totalOrders === 0 ? 0 : Math.round((cancelledOrders / totalOrders) * 1000) / 10;

            return ok(c, {
                totalRevenue: Number(revenueRows[0]?.totalRevenue ?? 0),
                totalOrders,
                completedOrders: Number(orderRows[0]?.completedOrders ?? 0),
                cancelledOrders,
                cancellationRate,
                outstandingAmount: Number(orderRows[0]?.outstandingAmount ?? 0),
            });
        } catch (err: any) {
            console.error("[laundry/reports/summary]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/reports/orders-by-status",
    authMiddleware,
    requireOrganization,
    requirePermission("report.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const conditions = [eq(laundryOrders.organizationId, orgId)];
            if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length === 1) {
                conditions.push(eq(laundryOrders.branchId, branchScope.effectiveBranchIds[0]!));
            } else if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 1) {
                conditions.push(inArray(laundryOrders.branchId, branchScope.effectiveBranchIds));
            }

            const rows = await db
                .select({ status: laundryOrders.status, total: sql<number>`COUNT(*)` })
                .from(laundryOrders)
                .where(and(...conditions))
                .groupBy(laundryOrders.status);

            return ok(c, rows.map((row: any) => ({ status: row.status, total: Number(row.total ?? 0) })));
        } catch (err: any) {
            console.error("[laundry/reports/orders-by-status]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/reports/outstanding-payments",
    authMiddleware,
    requireOrganization,
    requirePermission("report.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");
            const limit = Math.min(Number(c.req.query("limit") ?? 100), 200);

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const conditions = [eq(laundryOrders.organizationId, orgId), gt(laundryOrders.remainingAmount, 0)];
            if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length === 1) {
                conditions.push(eq(laundryOrders.branchId, branchScope.effectiveBranchIds[0]!));
            } else if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 1) {
                conditions.push(inArray(laundryOrders.branchId, branchScope.effectiveBranchIds));
            }

            const rows = await db
                .select({
                    id: laundryOrders.id,
                    orderNumber: laundryOrders.orderNumber,
                    customerName: laundryOrders.customerName,
                    customerPhone: laundryOrders.customerPhone,
                    totalAmount: laundryOrders.totalAmount,
                    paidAmount: laundryOrders.paidAmount,
                    remainingAmount: laundryOrders.remainingAmount,
                    status: laundryOrders.status,
                    createdAt: laundryOrders.createdAt,
                })
                .from(laundryOrders)
                .where(and(...conditions))
                .orderBy(desc(laundryOrders.remainingAmount), desc(laundryOrders.createdAt))
                .limit(limit);

            return ok(c, rows);
        } catch (err: any) {
            console.error("[laundry/reports/outstanding]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/reports/metrics",
    authMiddleware,
    requireOrganization,
    requirePermission("report.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const outboxConditions = [eq(laundryNotificationOutbox.organizationId, orgId)];
            if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length === 1) {
                outboxConditions.push(eq(laundryNotificationOutbox.branchId, branchScope.effectiveBranchIds[0]!));
            } else if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 1) {
                outboxConditions.push(inArray(laundryNotificationOutbox.branchId, branchScope.effectiveBranchIds));
            }

            const outboxRows = await db
                .select({
                    status: laundryNotificationOutbox.status,
                    total: sql<number>`COUNT(*)`,
                })
                .from(laundryNotificationOutbox)
                .where(and(...outboxConditions))
                .groupBy(laundryNotificationOutbox.status);

            const statusCounts = outboxRows.reduce(
                (acc: Record<string, number>, row: any) => {
                    acc[row.status] = Number(row.total ?? 0);
                    return acc;
                },
                {}
            );
            const runtimeMetrics = getLaundryRuntimeMetrics();
            const validationRejectRate = runtimeMetrics.createOrderAttempts === 0
                ? 0
                : Number((runtimeMetrics.validationRejects / runtimeMetrics.createOrderAttempts).toFixed(4));

            return ok(c, {
                deprecatedPickupHits: runtimeMetrics.deprecatedPickupHits,
                validationRejects: runtimeMetrics.validationRejects,
                createOrderAttempts: runtimeMetrics.createOrderAttempts,
                validationRejectRate,
                outboxQueuedCount: Number(statusCounts.queued ?? 0),
                outboxFailedCount: Number(statusCounts.failed ?? 0),
                outboxStatusCounts: {
                    queued: Number(statusCounts.queued ?? 0),
                    processing: Number(statusCounts.processing ?? 0),
                    sent: Number(statusCounts.sent ?? 0),
                    failed: Number(statusCounts.failed ?? 0),
                    deadLetter: Number(statusCounts.dead_letter ?? 0),
                },
            });
        } catch (err: any) {
            console.error("[laundry/reports/metrics]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/stream/orders",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");
            const since = Number(c.req.query("since") ?? c.req.header("Last-Event-ID") ?? "0");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            return createSseStream(c, orgId, branchScope.effectiveBranchIds, Number.isFinite(since) ? since : 0);
        } catch (err: any) {
            console.error("[laundry/stream/orders]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/ws",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const requestedBranchId = branchScope.effectiveBranchIds?.[0] ?? null;
            return connectLaundryWebSocket(c, {
                orgId,
                branchId: requestedBranchId,
            });
        } catch (err: any) {
            console.error("[laundry/ws]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/settings/wa-template",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");
            if (!branchId) return errors.badRequest(c, "branchId is required");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, "No access to branch");

            const [orgRow] = await db
                .select({ metadata: organization.metadata })
                .from(organization)
                .where(eq(organization.id, orgId))
                .limit(1);
            if (!orgRow) return errors.notFound(c, "Organization not found");

            const metadata = parseMetadata(orgRow.metadata);
            const template = metadata?.settings?.laundry?.waTemplates?.[branchId]
                ?? metadata?.settings?.laundry?.waTemplate
                ?? DEFAULT_WA_TEMPLATE;

            return ok(c, { branchId, template });
        } catch (err: any) {
            console.error("[laundry/settings/wa/get]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.patch(
    "/settings/wa-template",
    authMiddleware,
    requireOrganization,
    requirePermission("laundry.service.manage", "settings.manage"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const body = await c.req.json().catch(() => null);
            const parsedBody = patchWaTemplateSchema.safeParse(body);
            if (!parsedBody.success) return errors.badRequest(c, getValidationMessage(parsedBody.error));

            const { branchId, template } = parsedBody.data;
            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, "No access to branch");

            const actorContext = await getActorRoleContext(c, orgId);
            const isAllowed = actorContext.roles.some((role) => ORG_WIDE_ROLE.has(role) || role === "branch_manager");
            if (!isAllowed) return errors.forbidden(c, "Role not allowed to update WA template");

            const [orgRow] = await db
                .select({ metadata: organization.metadata })
                .from(organization)
                .where(eq(organization.id, orgId))
                .limit(1);
            if (!orgRow) return errors.notFound(c, "Organization not found");

            const metadata = parseMetadata(orgRow.metadata);
            metadata.settings = metadata.settings ?? {};
            metadata.settings.laundry = metadata.settings.laundry ?? {};
            metadata.settings.laundry.waTemplates = metadata.settings.laundry.waTemplates ?? {};
            metadata.settings.laundry.waTemplates[branchId] = template;

            await db.update(organization).set({ metadata: JSON.stringify(metadata) }).where(eq(organization.id, orgId));
            return ok(c, { branchId, template });
        } catch (err: any) {
            console.error("[laundry/settings/wa/patch]", err);
            return errors.internal(c);
        }
    }
);

function createSseStream(c: any, orgId: string, branchScope: string[] | null, fromSequence: number) {
    const db = c.get("db");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            let closed = false;
            let cursor = fromSequence;
            let pollingTimer: ReturnType<typeof setInterval> | null = null;
            let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

            const write = (chunk: string) => {
                if (!closed) controller.enqueue(encoder.encode(chunk));
            };
            const close = () => {
                if (closed) return;
                closed = true;
                if (pollingTimer) clearInterval(pollingTimer);
                if (heartbeatTimer) clearInterval(heartbeatTimer);
                try { controller.close(); } catch { /* no-op */ }
            };

            const poll = async () => {
                if (closed) return;
                try {
                    const conditions: any[] = [eq(laundryOrderStatusHistory.organizationId, orgId)];
                    if (branchScope && branchScope.length > 0) conditions.push(inArray(laundryOrderStatusHistory.branchId, branchScope));
                    if (cursor > 0) conditions.push(gt(laundryOrderStatusHistory.createdAt, new Date(cursor)));

                    const rows = await db
                        .select({
                            id: laundryOrderStatusHistory.id,
                            orderId: laundryOrderStatusHistory.orderId,
                            fromStatus: laundryOrderStatusHistory.fromStatus,
                            toStatus: laundryOrderStatusHistory.toStatus,
                            note: laundryOrderStatusHistory.note,
                            actorId: laundryOrderStatusHistory.actorId,
                            createdAt: laundryOrderStatusHistory.createdAt,
                            branchId: laundryOrderStatusHistory.branchId,
                        })
                        .from(laundryOrderStatusHistory)
                        .where(and(...conditions))
                        .orderBy(desc(laundryOrderStatusHistory.createdAt))
                        .limit(100);

                    for (const row of rows.reverse()) {
                        const eventCursor = new Date(row.createdAt).getTime();
                        cursor = Math.max(cursor, eventCursor);
                        write(`id: ${eventCursor}\n`);
                        write("event: order-status\n");
                        write(`data: ${JSON.stringify(row)}\n\n`);
                    }
                } catch {
                    write(`event: error\ndata: ${JSON.stringify({ message: "stream_failed" })}\n\n`);
                }
            };

            write("retry: 2000\n\n");
            pollingTimer = setInterval(poll, 2000);
            heartbeatTimer = setInterval(() => write(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`), 15000);
            void poll();
            c.req.raw.signal?.addEventListener("abort", close);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}

laundryRouter.patch(
    "/orders/:id/status",
    authMiddleware,
    requireOrganization,
    requirePermission("laundry.status.update", "laundry.driver.assign"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const orderId = c.req.param("id");
            const body = await c.req.json().catch(() => null);
            const parsedBody = patchStatusSchema.safeParse(body);
            if (!parsedBody.success) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: getValidationMessage(parsedBody.error),
                });
                return errors.badRequest(c, getValidationMessage(parsedBody.error));
            }

            const nextStatus = parsedBody.data.status.toLowerCase();
            if (!isLaundryOrderStatus(nextStatus)) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: "Invalid laundry status",
                });
                return errors.badRequest(c, "Invalid laundry status");
            }

            const [order] = await db
                .select({
                    id: laundryOrders.id,
                    branchId: laundryOrders.branchId,
                    status: laundryOrders.status,
                    assignedDriverId: laundryOrders.assignedDriverId,
                    orderNumber: laundryOrders.orderNumber,
                    customerName: laundryOrders.customerName,
                    customerPhone: laundryOrders.customerPhone,
                    remainingAmount: laundryOrders.remainingAmount,
                })
                .from(laundryOrders)
                .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                .limit(1);
            if (!order) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: "Order not found",
                });
                return errors.notFound(c, "Order not found");
            }

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, order.branchId)) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    reason: "No access to branch",
                });
                return errors.forbidden(c, "No access to branch");
            }

            if (!isLaundryOrderStatus(order.status)) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    reason: "Current order status is invalid",
                });
                return errors.badRequest(c, "Current order status is invalid");
            }
            if (!canTransitionLaundryOrderStatus(order.status, nextStatus)) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    reason: "Invalid status transition",
                });
                return errors.badRequest(c, "Invalid status transition");
            }
            if (nextStatus === "cancelled" && order.status !== "received" && order.status !== "processing") {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    reason: "Cancellation only allowed from received or processing",
                });
                return errors.badRequest(c, "Cancellation only allowed from received or processing");
            }

            const actorContext = await getActorRoleContext(c, orgId);
            if (!canRoleUpdateStatus(actorContext, order, nextStatus)) {
                logLaundryAction({
                    action: "order.status.update",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    actorId: actorContext.userId,
                    reason: "Role not allowed to update this status",
                });
                return errors.forbidden(c, "Role not allowed to update this status");
            }

            const actorId = actorContext.userId;
            const statusUpdate = await db.transaction(async (tx: any) => {
                const [row] = await tx
                    .update(laundryOrders)
                    .set({
                        status: nextStatus,
                        cancelledAt: nextStatus === "cancelled" ? new Date() : null,
                        completedAt: nextStatus === "completed" ? new Date() : null,
                    })
                    .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                    .returning();

                await tx.insert(laundryOrderStatusHistory).values({
                    organizationId: orgId,
                    branchId: order.branchId,
                    orderId,
                    fromStatus: order.status,
                    toStatus: nextStatus,
                    note: parsedBody.data.note ?? null,
                    actorId,
                });

                const domainEvent = await appendLaundryDomainEvent(tx, {
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    eventType: LAUNDRY_DOMAIN_EVENT_TYPES.ORDER_STATUS_CHANGED,
                    actorId,
                    payload: {
                        orderNumber: order.orderNumber,
                        previousStatus: order.status,
                        nextStatus,
                        note: parsedBody.data.note ?? null,
                    },
                });

                await enqueueLaundryNotificationOutbox(tx, {
                    orgId,
                    branchId: order.branchId,
                    eventId: domainEvent.id,
                    order: {
                        id: orderId,
                        orderNumber: order.orderNumber,
                        status: nextStatus,
                        customerName: order.customerName ?? null,
                        customerPhone: order.customerPhone ?? null,
                        remainingAmount: Number(row?.remainingAmount ?? order.remainingAmount ?? 0),
                    },
                });

                return {
                    updatedOrder: row,
                    domainEvent,
                };
            });

            await Promise.all([
                invalidateKpiCache(c, orgId),
                emitLaundryRealtimeEvent(c, statusUpdate.domainEvent),
            ]);

            logLaundryAction({
                action: "order.status.update",
                result: "success",
                orgId,
                branchId: order.branchId,
                orderId,
                actorId,
            });
            return ok(c, statusUpdate.updatedOrder);
        } catch (err: any) {
            console.error("[laundry/orders/status]", err);
            logLaundryAction({
                action: "order.status.update",
                result: "error",
                orderId: c.req.param("id"),
                reason: "Unhandled error",
            });
            return errors.internal(c);
        }
    }
);

laundryRouter.patch(
    "/orders/:id/driver",
    authMiddleware,
    requireOrganization,
    requirePermission("laundry.driver.assign"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const orderId = c.req.param("id");
            const body = await c.req.json().catch(() => null);
            const parsedBody = patchDriverSchema.safeParse(body);
            if (!parsedBody.success) {
                logLaundryAction({
                    action: "order.driver.assign",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: getValidationMessage(parsedBody.error),
                });
                return errors.badRequest(c, getValidationMessage(parsedBody.error));
            }

            const [order] = await db
                .select({
                    id: laundryOrders.id,
                    branchId: laundryOrders.branchId,
                    assignedDriverId: laundryOrders.assignedDriverId,
                    assignedDriverName: laundryOrders.assignedDriverName,
                })
                .from(laundryOrders)
                .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                .limit(1);
            if (!order) {
                logLaundryAction({
                    action: "order.driver.assign",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: "Order not found",
                });
                return errors.notFound(c, "Order not found");
            }

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, order.branchId)) {
                logLaundryAction({
                    action: "order.driver.assign",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    reason: "No access to branch",
                });
                return errors.forbidden(c, "No access to branch");
            }

            const actorContext = await getActorRoleContext(c, orgId);
            if (!canRoleAssignDriver(actorContext, order, parsedBody.data)) {
                logLaundryAction({
                    action: "order.driver.assign",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    actorId: actorContext.userId,
                    reason: "Role not allowed to assign driver",
                });
                return errors.forbidden(c, "Role not allowed to assign driver");
            }

            const actorId = actorContext.userId;
            const assignment = await db.transaction(async (tx: any) => {
                const resolvedDriver = await resolveDriverAssignment(tx, orgId, parsedBody.data.driverId);
                if ("error" in resolvedDriver) {
                    return resolvedDriver;
                }

                const [updatedOrder] = await tx
                    .update(laundryOrders)
                    .set({
                        assignedDriverId: resolvedDriver.driverId,
                        assignedDriverName: resolvedDriver.driverName,
                    })
                    .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                    .returning();

                const domainEvent = await appendLaundryDomainEvent(tx, {
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    eventType: LAUNDRY_DOMAIN_EVENT_TYPES.DRIVER_ASSIGNED,
                    actorId,
                    payload: {
                        previousDriverId: order.assignedDriverId,
                        previousDriverName: order.assignedDriverName,
                        nextDriverId: resolvedDriver.driverId,
                        nextDriverName: resolvedDriver.driverName,
                    },
                });

                return { updatedOrder, domainEvent };
            });
            if ("error" in assignment) {
                logLaundryAction({
                    action: "order.driver.assign",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    actorId,
                    reason: assignment.error,
                });
                if (assignment.status === 403) return errors.forbidden(c, assignment.error);
                return errors.badRequest(c, assignment.error);
            }

            await Promise.all([
                invalidateKpiCache(c, orgId),
                emitLaundryRealtimeEvent(c, assignment.domainEvent),
            ]);

            logLaundryAction({
                action: "order.driver.assign",
                result: "success",
                orgId,
                branchId: order.branchId,
                orderId,
                actorId,
            });
            return ok(c, assignment.updatedOrder);
        } catch (err: any) {
            console.error("[laundry/orders/driver]", err);
            logLaundryAction({
                action: "order.driver.assign",
                result: "error",
                orderId: c.req.param("id"),
                reason: "Unhandled error",
            });
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/orders/:id/payments",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const orderId = c.req.param("id");

            const [order] = await db
                .select({ id: laundryOrders.id, branchId: laundryOrders.branchId })
                .from(laundryOrders)
                .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                .limit(1);
            if (!order) return errors.notFound(c, "Order not found");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, order.branchId)) return errors.forbidden(c, "No access to branch");

            const rows = await db
                .select()
                .from(laundryPayments)
                .where(eq(laundryPayments.orderId, orderId))
                .orderBy(desc(laundryPayments.createdAt));
            return ok(c, rows);
        } catch (err: any) {
            console.error("[laundry/orders/payments/list]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.post(
    "/orders/:id/payments",
    authMiddleware,
    requireOrganization,
    requirePermission("laundry.payment.record"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const orderId = c.req.param("id");
            const body = await c.req.json().catch(() => null);
            const parsedBody = createPaymentSchema.safeParse(body);
            if (!parsedBody.success) {
                logLaundryAction({
                    action: "order.payment.record",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: getValidationMessage(parsedBody.error),
                });
                return errors.badRequest(c, getValidationMessage(parsedBody.error));
            }

            const [order] = await db
                .select({
                    id: laundryOrders.id,
                    branchId: laundryOrders.branchId,
                    paidAmount: laundryOrders.paidAmount,
                    totalAmount: laundryOrders.totalAmount,
                    remainingAmount: laundryOrders.remainingAmount,
                    orderNumber: laundryOrders.orderNumber,
                })
                .from(laundryOrders)
                .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                .limit(1);
            if (!order) {
                logLaundryAction({
                    action: "order.payment.record",
                    result: "rejected",
                    orgId,
                    orderId,
                    reason: "Order not found",
                });
                return errors.notFound(c, "Order not found");
            }

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, order.branchId)) {
                logLaundryAction({
                    action: "order.payment.record",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    reason: "No access to branch",
                });
                return errors.forbidden(c, "No access to branch");
            }

            const actorContext = await getActorRoleContext(c, orgId);
            if (!canRoleRecordPayment(actorContext)) {
                logLaundryAction({
                    action: "order.payment.record",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    actorId: actorContext.userId,
                    reason: "Role not allowed to record payment",
                });
                return errors.forbidden(c, "Role not allowed to record payment");
            }
            if (parsedBody.data.amount > Number(order.remainingAmount ?? 0)) {
                logLaundryAction({
                    action: "order.payment.record",
                    result: "rejected",
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    actorId: actorContext.userId,
                    reason: "Overpayment is not allowed",
                });
                return errors.badRequest(c, "Overpayment is not allowed");
            }

            const result = await db.transaction(async (tx: any) => {
                const [payment] = await tx
                    .insert(laundryPayments)
                    .values({
                        organizationId: orgId,
                        branchId: order.branchId,
                        orderId,
                        amount: parsedBody.data.amount,
                        paymentMethod: parsedBody.data.paymentMethod ?? "manual",
                        note: parsedBody.data.note ?? null,
                        recordedBy: actorContext.userId,
                    })
                    .returning();

                const paidAmount = Number(order.paidAmount ?? 0) + parsedBody.data.amount;
                const remainingAmount = Number(order.totalAmount ?? 0) - paidAmount;
                const paymentStatus = remainingAmount <= 0 ? "paid" : "partial";

                const [updatedOrder] = await tx
                    .update(laundryOrders)
                    .set({ paidAmount, remainingAmount, paymentStatus })
                    .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                    .returning();

                const domainEvent = await appendLaundryDomainEvent(tx, {
                    orgId,
                    branchId: order.branchId,
                    orderId,
                    eventType: LAUNDRY_DOMAIN_EVENT_TYPES.PAYMENT_RECORDED,
                    actorId: actorContext.userId,
                    payload: {
                        orderNumber: order.orderNumber,
                        paymentId: payment.id,
                        amount: payment.amount,
                        paymentMethod: payment.paymentMethod ?? "manual",
                        remainingAmount,
                        paymentStatus,
                    },
                });

                return { payment, order: updatedOrder, domainEvent };
            });

            await Promise.all([
                invalidateKpiCache(c, orgId),
                emitLaundryRealtimeEvent(c, result.domainEvent),
            ]);

            logLaundryAction({
                action: "order.payment.record",
                result: "success",
                orgId,
                branchId: order.branchId,
                orderId,
                actorId: actorContext.userId,
            });
            return ok(c, result);
        } catch (err: any) {
            console.error("[laundry/orders/payments/create]", err);
            logLaundryAction({
                action: "order.payment.record",
                result: "error",
                orderId: c.req.param("id"),
                reason: "Unhandled error",
            });
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/orders/:id/receipt",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const orderId = c.req.param("id");
            const [order] = await db
                .select()
                .from(laundryOrders)
                .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                .limit(1);
            if (!order) return errors.notFound(c, "Order not found");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, order.branchId)) return errors.forbidden(c, "No access to branch");

            const [items, paymentsRows, orgRows] = await Promise.all([
                db.select().from(laundryOrderItems).where(eq(laundryOrderItems.orderId, order.id)).orderBy(desc(laundryOrderItems.createdAt)),
                db.select().from(laundryPayments).where(eq(laundryPayments.orderId, order.id)).orderBy(desc(laundryPayments.createdAt)),
                db.select({ metadata: organization.metadata, name: organization.name }).from(organization).where(eq(organization.id, orgId)).limit(1),
            ]);

            const metadata = parseMetadata(orgRows[0]?.metadata ?? null);
            const template =
                metadata?.settings?.laundry?.waTemplates?.[order.branchId]
                ?? metadata?.settings?.laundry?.waTemplate
                ?? DEFAULT_WA_TEMPLATE;

            const waMessageText = buildWaMessage(template, {
                customerName: order.customerName ?? "Pelanggan",
                orderNumber: order.orderNumber,
                status: order.status,
                remainingAmount: String(order.remainingAmount),
            });

            return ok(c, {
                order,
                thermal: {
                    businessName: orgRows[0]?.name ?? "Laundry",
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    items: items.map((item: any) => ({
                        name: item.serviceName,
                        quantity: toQuantityNumber(item.quantity),
                        unitPrice: item.unitPrice,
                        lineTotal: item.lineTotal,
                    })),
                    subtotalAmount: order.subtotalAmount,
                    totalAmount: order.totalAmount,
                    paidAmount: order.paidAmount,
                    remainingAmount: order.remainingAmount,
                    paymentHistory: paymentsRows.map((payment: any) => ({
                        amount: payment.amount,
                        method: payment.paymentMethod,
                        createdAt: payment.createdAt,
                    })),
                },
                waMessageText,
            });
        } catch (err: any) {
            console.error("[laundry/orders/receipt]", err);
            return errors.internal(c);
        }
    }
);


laundryRouter.post(
    "/services",
    authMiddleware,
    requireOrganization,
    requirePermission("laundry.service.manage"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const body = await c.req.json().catch(() => null);
            const parsedBody = createServiceSchema.safeParse(body);
            if (!parsedBody.success) return errors.badRequest(c, getValidationMessage(parsedBody.error));

            const { branchId } = parsedBody.data;
            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, "No access to branch");

            const [created] = await db
                .insert(laundryServices)
                .values({ organizationId: orgId, ...parsedBody.data })
                .returning();

            return ok(c, created);
        } catch (err: any) {
            console.error("[laundry/services/create]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.patch(
    "/services",
    authMiddleware,
    requireOrganization,
    requirePermission("laundry.service.manage"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const body = await c.req.json().catch(() => null);
            const parsedBody = patchServiceSchema.safeParse(body);
            if (!parsedBody.success) return errors.badRequest(c, getValidationMessage(parsedBody.error));

            const [existing] = await db
                .select({ id: laundryServices.id, branchId: laundryServices.branchId })
                .from(laundryServices)
                .where(and(eq(laundryServices.organizationId, orgId), eq(laundryServices.id, parsedBody.data.id)))
                .limit(1);
            if (!existing) return errors.notFound(c, "Service not found");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, existing.branchId)) {
                return errors.forbidden(c, "No access to branch");
            }

            const payload: any = {};
            if (parsedBody.data.name !== undefined) payload.name = parsedBody.data.name;
            if (parsedBody.data.unit !== undefined) payload.unit = parsedBody.data.unit;
            if (parsedBody.data.basePrice !== undefined) payload.basePrice = parsedBody.data.basePrice;
            if (parsedBody.data.estimatedDurationHours !== undefined) payload.estimatedDurationHours = parsedBody.data.estimatedDurationHours;
            if (parsedBody.data.isActive !== undefined) payload.isActive = parsedBody.data.isActive;

            const [updated] = await db
                .update(laundryServices)
                .set(payload)
                .where(and(eq(laundryServices.organizationId, orgId), eq(laundryServices.id, parsedBody.data.id)))
                .returning();

            return ok(c, updated);
        } catch (err: any) {
            console.error("[laundry/services/update]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/orders",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const branchId = c.req.query("branchId");
            const status = c.req.query("status");
            const orderType = c.req.query("orderType");
            const q = c.req.query("q");
            const outstanding = c.req.query("outstanding");
            const dateFrom = c.req.query("dateFrom");
            const dateTo = c.req.query("dateTo");
            const limit = Math.min(Number(c.req.query("limit") ?? DEFAULT_ORDER_LIMIT), 200);

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            const branchScope = ensureBranchFilter(branchIds, isOrgWide, branchId);
            if (!branchScope.ok) return errors.forbidden(c, branchScope.message);

            const range = buildDateRange(dateFrom, dateTo);
            if ("error" in range) return errors.badRequest(c, range.error);

            const conditions = [eq(laundryOrders.organizationId, orgId)];
            if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length === 1) {
                conditions.push(eq(laundryOrders.branchId, branchScope.effectiveBranchIds[0]!));
            } else if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 1) {
                conditions.push(inArray(laundryOrders.branchId, branchScope.effectiveBranchIds));
            }
            if (status) conditions.push(eq(laundryOrders.status, status));
            if (orderType) conditions.push(eq(laundryOrders.orderType, orderType));
            if (outstanding === "true") conditions.push(gt(laundryOrders.remainingAmount, 0));
            if (range.from) conditions.push(gte(laundryOrders.createdAt, range.from));
            if (range.to) conditions.push(lte(laundryOrders.createdAt, range.to));
            if (q) {
                const query = `%${q}%`;
                conditions.push(
                    sql`(${laundryOrders.orderNumber} ilike ${query}
                    or ${laundryOrders.customerName} ilike ${query}
                    or ${laundryOrders.customerPhone} ilike ${query})`
                );
            }

            const rows = await db
                .select({
                    id: laundryOrders.id,
                    orderNumber: laundryOrders.orderNumber,
                    status: laundryOrders.status,
                    orderType: laundryOrders.orderType,
                    totalAmount: laundryOrders.totalAmount,
                    paidAmount: laundryOrders.paidAmount,
                    remainingAmount: laundryOrders.remainingAmount,
                    paymentStatus: laundryOrders.paymentStatus,
                    customerName: laundryOrders.customerName,
                    customerPhone: laundryOrders.customerPhone,
                    customerAddress: laundryOrders.customerAddress,
                    notes: laundryOrders.notes,
                    branchId: laundryOrders.branchId,
                    branchName: branches.name,
                    createdAt: laundryOrders.createdAt,
                    estimatedCompletedAt: laundryOrders.estimatedCompletedAt,
                    assignedDriverId: laundryOrders.assignedDriverId,
                    assignedDriverName: laundryOrders.assignedDriverName,
                })
                .from(laundryOrders)
                .leftJoin(branches, eq(laundryOrders.branchId, branches.id))
                .where(and(...conditions))
                .orderBy(desc(laundryOrders.createdAt))
                .limit(limit);

            return ok(c, rows);
        } catch (err: any) {
            console.error("[laundry/orders/list]", err);
            return errors.internal(c);
        }
    }
);

laundryRouter.post(
    "/orders",
    authMiddleware,
    requireOrganization,
    requirePermission("order.create"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            incrementLaundryOrderCreateAttempts();
            const body = await c.req.json().catch(() => null);
            const parsedBody = createOrderSchema.safeParse(body);
            if (!parsedBody.success) {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    orgId,
                    reason: getValidationMessage(parsedBody.error),
                });
                return errors.badRequest(c, getValidationMessage(parsedBody.error));
            }

            const { branchId, customerId, items } = parsedBody.data;
            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, branchId)) {
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    orgId,
                    branchId,
                    reason: "No access to branch",
                });
                return errors.forbidden(c, "No access to branch");
            }

            let customerProfile: { id: string; name: string; phone: string | null; address: string | null } | null = null;
            if (customerId) {
                const [row] = await db
                    .select({ id: customers.id, name: customers.name, phone: customers.phone, address: customers.address })
                    .from(customers)
                    .where(and(eq(customers.organizationId, orgId), eq(customers.id, customerId)))
                    .limit(1);
                if (!row) {
                    incrementLaundryValidationRejects();
                    logLaundryAction({
                        action: "order.create",
                        result: "rejected",
                        orgId,
                        branchId,
                        reason: "customerId not found",
                    });
                    return errors.badRequest(c, "customerId not found");
                }
                customerProfile = row;
            }

            const normalizedManualPhone = normalizePhoneDigits(parsedBody.data.customerPhone ?? null);
            const normalizedProfilePhone = normalizePhoneDigits(customerProfile?.phone ?? null);
            const normalizedPhone = normalizedManualPhone ?? normalizedProfilePhone;
            const normalizedAddress = normalizeAddress(parsedBody.data.customerAddress ?? customerProfile?.address ?? null);
            const normalizedCustomerName = parsedBody.data.customerName?.trim() || customerProfile?.name || null;

            if ((parsedBody.data.customerPhone ?? null) && !normalizedManualPhone) {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    orgId,
                    branchId,
                    reason: "customerPhone must contain digits",
                });
                return errors.badRequest(c, "customerPhone must contain digits");
            }

            if (normalizedPhone && !isValidOperationalPhone(normalizedPhone)) {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    orgId,
                    branchId,
                    reason: `customerPhone must be ${PHONE_DIGITS_MIN}-${PHONE_DIGITS_MAX} digits`,
                });
                return errors.badRequest(c, `customerPhone must be ${PHONE_DIGITS_MIN}-${PHONE_DIGITS_MAX} digits`);
            }

            if (customerId && (!normalizedPhone || !normalizedAddress)) {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    orgId,
                    branchId,
                    reason: "customerId requires phone and address (from profile or manual input)",
                });
                return errors.badRequest(c, "customerId requires phone and address (from profile or manual input)");
            }

            if (
                (parsedBody.data.orderType === "pickup" || parsedBody.data.orderType === "drop_off")
                && (!normalizedPhone || !normalizedAddress)
            ) {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    orgId,
                    branchId,
                    reason: "pickup/drop_off orders require customerPhone and customerAddress",
                });
                return errors.badRequest(c, "pickup/drop_off orders require customerPhone and customerAddress");
            }

            const serviceIds = items.map((item) => item.serviceId).filter(Boolean) as string[];
            const serviceRows: any[] = serviceIds.length === 0
                ? []
                : await db
                    .select({
                        id: laundryServices.id,
                        name: laundryServices.name,
                        basePrice: laundryServices.basePrice,
                        estimatedDurationHours: laundryServices.estimatedDurationHours,
                    })
                    .from(laundryServices)
                    .where(and(
                        eq(laundryServices.organizationId, orgId),
                        eq(laundryServices.branchId, branchId),
                        inArray(laundryServices.id, serviceIds)
                    ));

            const serviceMap = new Map<string, any>(serviceRows.map((service: any): [string, any] => [service.id, service]));
            const normalizedItems = items.map((item: any) => {
                const service: any = item.serviceId ? serviceMap.get(item.serviceId) : null;
                if (item.serviceId && !service) throw new Error("SERVICE_NOT_FOUND");

                const unitPrice = item.unitPrice ?? service?.basePrice ?? 0;
                const name = item.name ?? service?.name;
                if (!name || unitPrice < 0) throw new Error("INVALID_ITEM");

                const quantity = toQuantityNumber(item.quantity);
                const lineTotal = toRoundedAmount(quantity * unitPrice);
                const estimatedDurationHours = item.estimatedDurationHours ?? service?.estimatedDurationHours ?? 0;

                return {
                    serviceId: item.serviceId ?? null,
                    serviceName: name,
                    quantity,
                    quantityRaw: String(quantity),
                    unitPrice,
                    lineTotal,
                    estimatedDurationHours,
                    notes: item.notes ?? null,
                };
            });

            const subtotalAmount = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
            const totalAmount = Math.max(0, subtotalAmount - parsedBody.data.discountAmount + parsedBody.data.taxAmount);
            const paidAmount = Math.min(parsedBody.data.initialPaymentAmount, totalAmount);
            const remainingAmount = totalAmount - paidAmount;
            const maxDurationHours = normalizedItems.reduce((max, item) => Math.max(max, item.estimatedDurationHours), 0);

            let actorId: string | null = null;
            try {
                actorId = getUserId(c);
            } catch {
                actorId = null;
            }

            const created = await db.transaction(async (tx: any) => {
                const orderNumber = await generateLaundryOrderNumber(tx, { organizationId: orgId, branchId });
                const createdAt = new Date();
                const estimatedCompletedAt = new Date(createdAt.getTime() + maxDurationHours * 3600_000);

                const [order] = await tx
                    .insert(laundryOrders)
                    .values({
                        organizationId: orgId,
                        branchId,
                        customerId: customerProfile?.id ?? parsedBody.data.customerId ?? null,
                        orderNumber,
                        status: "received",
                        orderType: parsedBody.data.orderType,
                        customerName: normalizedCustomerName,
                        customerPhone: normalizedPhone,
                        customerAddress: normalizedAddress,
                        notes: parsedBody.data.notes ?? null,
                        estimatedCompletedAt,
                        subtotalAmount,
                        discountAmount: parsedBody.data.discountAmount,
                        taxAmount: parsedBody.data.taxAmount,
                        totalAmount,
                        paidAmount,
                        remainingAmount,
                        paymentStatus: paidAmount <= 0 ? "pending" : (remainingAmount === 0 ? "paid" : "partial"),
                        createdBy: actorId,
                    })
                    .returning();

                await tx.insert(laundryOrderItems).values(
                    normalizedItems.map((item) => ({
                        orderId: order.id,
                        serviceId: item.serviceId,
                        serviceName: item.serviceName,
                        quantity: item.quantityRaw,
                        unitPrice: item.unitPrice,
                        lineTotal: item.lineTotal,
                        estimatedDurationHours: item.estimatedDurationHours,
                        notes: item.notes,
                    }))
                );

                if (paidAmount > 0) {
                    await tx.insert(laundryPayments).values({
                        organizationId: orgId,
                        branchId,
                        orderId: order.id,
                        amount: paidAmount,
                        paymentMethod: parsedBody.data.paymentMethod ?? "manual",
                        note: "Initial payment",
                        recordedBy: actorId,
                    });
                }

                await tx.insert(laundryOrderStatusHistory).values({
                    organizationId: orgId,
                    branchId,
                    orderId: order.id,
                    fromStatus: null,
                    toStatus: "received",
                    note: "Order created",
                    actorId,
                });

                const events: Array<{
                    id: string;
                    sequence: number;
                    organizationId: string;
                    branchId: string | null;
                    eventType: string;
                    occurredAt: Date | string;
                    payload: Record<string, unknown>;
                }> = [];

                const orderCreatedEvent = await appendLaundryDomainEvent(tx, {
                    orgId,
                    branchId,
                    orderId: order.id,
                    eventType: LAUNDRY_DOMAIN_EVENT_TYPES.ORDER_CREATED,
                    actorId,
                    payload: {
                        orderNumber: order.orderNumber,
                        orderType: order.orderType,
                        status: order.status,
                        itemCount: normalizedItems.length,
                        totalAmount: order.totalAmount,
                        paidAmount: order.paidAmount,
                        remainingAmount: order.remainingAmount,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        customerAddress: order.customerAddress,
                    },
                });
                events.push(orderCreatedEvent);

                if (paidAmount > 0) {
                    const paymentRecordedEvent = await appendLaundryDomainEvent(tx, {
                        orgId,
                        branchId,
                        orderId: order.id,
                        eventType: LAUNDRY_DOMAIN_EVENT_TYPES.PAYMENT_RECORDED,
                        actorId,
                        payload: {
                            orderNumber: order.orderNumber,
                            amount: paidAmount,
                            paymentMethod: parsedBody.data.paymentMethod ?? "manual",
                            note: "Initial payment",
                            remainingAmount: order.remainingAmount,
                            paymentStatus: order.paymentStatus,
                        },
                    });
                    events.push(paymentRecordedEvent);
                }

                return { order, events };
            });

            await Promise.all([
                invalidateKpiCache(c, orgId),
                ...created.events.map((event: {
                    id: string;
                    sequence: number;
                    organizationId: string;
                    branchId: string | null;
                    eventType: string;
                    occurredAt: Date | string;
                    payload: Record<string, unknown>;
                }) => emitLaundryRealtimeEvent(c, event)),
            ]);

            logLaundryAction({
                action: "order.create",
                result: "success",
                orgId,
                branchId,
                orderId: created.order.id,
                actorId,
            });
            return ok(c, created.order);
        } catch (err: any) {
            console.error("[laundry/orders/create]", err);
            if (err?.message === "SERVICE_NOT_FOUND") {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    reason: "serviceId not found",
                });
                return errors.badRequest(c, "serviceId not found");
            }
            if (err?.message === "INVALID_ITEM") {
                incrementLaundryValidationRejects();
                logLaundryAction({
                    action: "order.create",
                    result: "rejected",
                    reason: "Invalid item payload",
                });
                return errors.badRequest(c, "Invalid item payload");
            }
            logLaundryAction({
                action: "order.create",
                result: "error",
                reason: "Unhandled error",
            });
            return errors.internal(c);
        }
    }
);

laundryRouter.get(
    "/orders/:id",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    async (c) => {
        try {
            const db = c.get("db");
            const orgId = await getOrgId(c);
            const orderId = c.req.param("id");
            const [order] = await db
                .select()
                .from(laundryOrders)
                .where(and(eq(laundryOrders.organizationId, orgId), eq(laundryOrders.id, orderId)))
                .limit(1);
            if (!order) return errors.notFound(c, "Order not found");

            const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
            if (!isOrgWide && !hasBranchAccess(branchIds, order.branchId)) return errors.forbidden(c, "No access to branch");

            const [items, paymentsRows, historyRows] = await Promise.all([
                db.select().from(laundryOrderItems).where(eq(laundryOrderItems.orderId, order.id)).orderBy(desc(laundryOrderItems.createdAt)),
                db.select().from(laundryPayments).where(eq(laundryPayments.orderId, order.id)).orderBy(desc(laundryPayments.createdAt)),
                db.select().from(laundryOrderStatusHistory).where(eq(laundryOrderStatusHistory.orderId, order.id)).orderBy(desc(laundryOrderStatusHistory.createdAt)),
            ]);

            return ok(c, {
                ...order,
                items: items.map((item: any) => ({ ...item, quantity: toQuantityNumber(item.quantity) })),
                payments: paymentsRows,
                timeline: historyRows,
            });
        } catch (err: any) {
            console.error("[laundry/orders/detail]", err);
            return errors.internal(c);
        }
    }
);
