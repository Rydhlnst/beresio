import { Hono } from "hono";
import { and, asc, eq, inArray } from "drizzle-orm";
import { authMiddleware } from "../../middleware/auth";
import { getOrgId, getUserId } from "../../lib/auth-context";
import { errors, ok } from "../../lib/errors";
import { getBranchAccessContext, hasBranchAccess } from "../../lib/branch-access";
import {
    branches,
    fnbMenuScheduleRules,
    fnbTableSessions,
    fnbTables,
} from "@beresio/db";

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string };
type Variables = { db: any; user: any; session: any };

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const fnbRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================
// TABLES
// ============================================

// GET /api/dashboard/fnb/tables
fnbRouter.get("/tables", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const branchId = c.req.query("branchId");
        const status = c.req.query("status");
        const isActive = c.req.query("isActive");
        const limit = Math.min(Number(c.req.query("limit") ?? 200), 500);

        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, "No branch access");

        const conditions = [eq(fnbTables.organizationId, orgId)];
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, "No access to branch");
            conditions.push(eq(fnbTables.branchId, branchId));
        } else if (branchIds.length > 0) {
            conditions.push(inArray(fnbTables.branchId, branchIds));
        }
        if (status) conditions.push(eq(fnbTables.status, status));
        if (isActive === "true") conditions.push(eq(fnbTables.isActive, true));
        if (isActive === "false") conditions.push(eq(fnbTables.isActive, false));

        const rows = await db
            .select({
                id: fnbTables.id,
                branchId: fnbTables.branchId,
                branchName: branches.name,
                code: fnbTables.code,
                name: fnbTables.name,
                area: fnbTables.area,
                capacity: fnbTables.capacity,
                status: fnbTables.status,
                isActive: fnbTables.isActive,
                createdAt: fnbTables.createdAt,
                updatedAt: fnbTables.updatedAt,
            })
            .from(fnbTables)
            .leftJoin(branches, eq(fnbTables.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(asc(fnbTables.branchId), asc(fnbTables.area), asc(fnbTables.code))
            .limit(limit);

        return ok(c, rows);
    } catch (err: any) {
        console.error("[fnb/tables:list]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/fnb/tables
fnbRouter.post("/tables", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const body = await c.req.json().catch(() => null);
        const branchId = body?.branchId ? String(body.branchId) : "";
        const code = String(body?.code ?? "").trim();
        const name = String(body?.name ?? "").trim();
        const area = body?.area ? String(body.area).trim() : null;
        const capacity = Number(body?.capacity ?? 1);
        const status = body?.status ? String(body.status) : "available";

        if (!branchId) return errors.badRequest(c, "branchId is required");
        if (!code) return errors.badRequest(c, "code is required");
        if (!name) return errors.badRequest(c, "name is required");
        if (!Number.isFinite(capacity) || capacity < 1) return errors.badRequest(c, "capacity must be >= 1");

        const { branchIds } = await getBranchAccessContext(c, orgId);
        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, "No access to branch");

        const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.organizationId, orgId), eq(branches.id, branchId)))
            .limit(1);
        if (!branchRow) return errors.badRequest(c, "Branch not found");

        const [dup] = await db
            .select({ id: fnbTables.id })
            .from(fnbTables)
            .where(and(
                eq(fnbTables.organizationId, orgId),
                eq(fnbTables.branchId, branchId),
                eq(fnbTables.code, code)
            ))
            .limit(1);
        if (dup) return errors.badRequest(c, "Kode meja sudah digunakan di cabang ini");

        const [created] = await db
            .insert(fnbTables)
            .values({
                organizationId: orgId,
                branchId,
                code,
                name,
                area,
                capacity,
                status,
                isActive: body?.isActive !== false,
            })
            .returning();

        return ok(c, created);
    } catch (err: any) {
        console.error("[fnb/tables:create]", err);
        return errors.internal(c, err.message);
    }
});

// PATCH /api/dashboard/fnb/tables
fnbRouter.patch("/tables", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const body = await c.req.json().catch(() => null);
        const tableId = body?.id ? String(body.id) : "";
        if (!tableId) return errors.badRequest(c, "id is required");

        const [existing] = await db
            .select({
                id: fnbTables.id,
                branchId: fnbTables.branchId,
                code: fnbTables.code,
            })
            .from(fnbTables)
            .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            .limit(1);
        if (!existing) return errors.notFound(c, "Table not found");

        const { branchIds } = await getBranchAccessContext(c, orgId);
        if (!hasBranchAccess(branchIds, existing.branchId)) return errors.forbidden(c, "No access to branch");

        const updates: any = {};
        if (body?.name !== undefined) updates.name = String(body.name).trim();
        if (body?.area !== undefined) updates.area = body.area ? String(body.area).trim() : null;
        if (body?.capacity !== undefined) {
            const capacity = Number(body.capacity);
            if (!Number.isFinite(capacity) || capacity < 1) return errors.badRequest(c, "capacity must be >= 1");
            updates.capacity = capacity;
        }
        if (body?.status !== undefined) updates.status = String(body.status);
        if (body?.isActive !== undefined) updates.isActive = Boolean(body.isActive);
        if (body?.code !== undefined) {
            const nextCode = String(body.code).trim();
            if (!nextCode) return errors.badRequest(c, "code cannot be empty");
            if (nextCode !== existing.code) {
                const [dup] = await db
                    .select({ id: fnbTables.id })
                    .from(fnbTables)
                    .where(and(
                        eq(fnbTables.organizationId, orgId),
                        eq(fnbTables.branchId, existing.branchId),
                        eq(fnbTables.code, nextCode)
                    ))
                    .limit(1);
                if (dup) return errors.badRequest(c, "Kode meja sudah digunakan di cabang ini");
            }
            updates.code = nextCode;
        }

        if (Object.keys(updates).length === 0) {
            return errors.badRequest(c, "Tidak ada field yang diupdate");
        }

        const [updated] = await db
            .update(fnbTables)
            .set(updates)
            .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            .returning();

        return ok(c, updated);
    } catch (err: any) {
        console.error("[fnb/tables:update]", err);
        return errors.internal(c, err.message);
    }
});

// ============================================
// TABLE SESSIONS
// ============================================

// GET /api/dashboard/fnb/table-sessions
fnbRouter.get("/table-sessions", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const branchId = c.req.query("branchId");
        const tableId = c.req.query("tableId");
        const status = c.req.query("status");
        const limit = Math.min(Number(c.req.query("limit") ?? 100), 300);

        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, "No branch access");

        const conditions = [eq(fnbTableSessions.organizationId, orgId)];
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, "No access to branch");
            conditions.push(eq(fnbTableSessions.branchId, branchId));
        } else if (branchIds.length > 0) {
            conditions.push(inArray(fnbTableSessions.branchId, branchIds));
        }
        if (tableId) conditions.push(eq(fnbTableSessions.tableId, tableId));
        if (status) conditions.push(eq(fnbTableSessions.status, status));

        const rows = await db
            .select({
                id: fnbTableSessions.id,
                tableId: fnbTableSessions.tableId,
                tableCode: fnbTables.code,
                tableName: fnbTables.name,
                branchId: fnbTableSessions.branchId,
                branchName: branches.name,
                orderId: fnbTableSessions.orderId,
                status: fnbTableSessions.status,
                holdState: fnbTableSessions.holdState,
                guestCount: fnbTableSessions.guestCount,
                customerName: fnbTableSessions.customerName,
                notes: fnbTableSessions.notes,
                openedAt: fnbTableSessions.openedAt,
                closedAt: fnbTableSessions.closedAt,
                createdAt: fnbTableSessions.createdAt,
                updatedAt: fnbTableSessions.updatedAt,
            })
            .from(fnbTableSessions)
            .leftJoin(fnbTables, eq(fnbTableSessions.tableId, fnbTables.id))
            .leftJoin(branches, eq(fnbTableSessions.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(asc(fnbTableSessions.openedAt))
            .limit(limit);

        return ok(c, rows);
    } catch (err: any) {
        console.error("[fnb/table-sessions:list]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/fnb/table-sessions
fnbRouter.post("/table-sessions", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const body = await c.req.json().catch(() => null);
        const tableId = body?.tableId ? String(body.tableId) : "";
        if (!tableId) return errors.badRequest(c, "tableId is required");

        const [tableRow] = await db
            .select({
                id: fnbTables.id,
                branchId: fnbTables.branchId,
                status: fnbTables.status,
                isActive: fnbTables.isActive,
            })
            .from(fnbTables)
            .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            .limit(1);
        if (!tableRow) return errors.notFound(c, "Table not found");

        const { branchIds } = await getBranchAccessContext(c, orgId);
        if (!hasBranchAccess(branchIds, tableRow.branchId)) return errors.forbidden(c, "No access to branch");
        if (!tableRow.isActive) return errors.badRequest(c, "Table is inactive");

        const [activeSession] = await db
            .select({ id: fnbTableSessions.id })
            .from(fnbTableSessions)
            .where(and(
                eq(fnbTableSessions.organizationId, orgId),
                eq(fnbTableSessions.tableId, tableId),
                inArray(fnbTableSessions.status, ["open", "held"])
            ))
            .limit(1);
        if (activeSession) return errors.badRequest(c, "Table already has active session");

        const actorId = (() => {
            try {
                return getUserId(c);
            } catch {
                return null;
            }
        })();

        const [created] = await db.transaction(async (tx: any) => {
            const [session] = await tx
                .insert(fnbTableSessions)
                .values({
                    organizationId: orgId,
                    branchId: tableRow.branchId,
                    tableId,
                    orderId: body?.orderId ? String(body.orderId) : null,
                    status: "open",
                    holdState: "none",
                    guestCount: Math.max(1, Number(body?.guestCount ?? 1)),
                    customerName: body?.customerName ? String(body.customerName) : null,
                    notes: body?.notes ? String(body.notes) : null,
                    createdBy: actorId,
                    updatedBy: actorId,
                })
                .returning();

            await tx
                .update(fnbTables)
                .set({ status: "occupied" })
                .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)));

            return [session];
        });

        return ok(c, created);
    } catch (err: any) {
        console.error("[fnb/table-sessions:create]", err);
        return errors.internal(c, err.message);
    }
});

// PATCH /api/dashboard/fnb/table-sessions
fnbRouter.patch("/table-sessions", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const body = await c.req.json().catch(() => null);
        const sessionId = body?.id ? String(body.id) : "";
        if (!sessionId) return errors.badRequest(c, "id is required");

        const [existing] = await db
            .select({
                id: fnbTableSessions.id,
                tableId: fnbTableSessions.tableId,
                branchId: fnbTableSessions.branchId,
                status: fnbTableSessions.status,
            })
            .from(fnbTableSessions)
            .where(and(eq(fnbTableSessions.organizationId, orgId), eq(fnbTableSessions.id, sessionId)))
            .limit(1);
        if (!existing) return errors.notFound(c, "Table session not found");

        const { branchIds } = await getBranchAccessContext(c, orgId);
        if (!hasBranchAccess(branchIds, existing.branchId)) return errors.forbidden(c, "No access to branch");

        const updates: any = {};
        if (body?.orderId !== undefined) updates.orderId = body.orderId ? String(body.orderId) : null;
        if (body?.status !== undefined) updates.status = String(body.status);
        if (body?.holdState !== undefined) updates.holdState = String(body.holdState);
        if (body?.guestCount !== undefined) {
            const guestCount = Number(body.guestCount);
            if (!Number.isFinite(guestCount) || guestCount < 1) return errors.badRequest(c, "guestCount must be >= 1");
            updates.guestCount = guestCount;
        }
        if (body?.customerName !== undefined) updates.customerName = body.customerName ? String(body.customerName) : null;
        if (body?.notes !== undefined) updates.notes = body.notes ? String(body.notes) : null;

        if (Object.keys(updates).length === 0) {
            return errors.badRequest(c, "Tidak ada field yang diupdate");
        }

        const actorId = (() => {
            try {
                return getUserId(c);
            } catch {
                return null;
            }
        })();

        updates.updatedBy = actorId;
        if (updates.status === "closed" || updates.status === "cancelled") {
            updates.closedAt = new Date();
        }

        const [updated] = await db.transaction(async (tx: any) => {
            const [nextSession] = await tx
                .update(fnbTableSessions)
                .set(updates)
                .where(and(eq(fnbTableSessions.organizationId, orgId), eq(fnbTableSessions.id, sessionId)))
                .returning();

            let nextTableStatus = "occupied";
            if (nextSession.status === "closed" || nextSession.status === "cancelled") {
                nextTableStatus = "available";
            }

            await tx
                .update(fnbTables)
                .set({ status: nextTableStatus })
                .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, existing.tableId)));

            return [nextSession];
        });

        return ok(c, updated);
    } catch (err: any) {
        console.error("[fnb/table-sessions:update]", err);
        return errors.internal(c, err.message);
    }
});

// ============================================
// MENU SCHEDULE RULES
// ============================================

// GET /api/dashboard/fnb/menu-schedules
fnbRouter.get("/menu-schedules", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const productId = c.req.query("productId");
        const branchId = c.req.query("branchId");

        const conditions = [eq(fnbMenuScheduleRules.organizationId, orgId)];
        if (productId) conditions.push(eq(fnbMenuScheduleRules.productId, productId));
        if (branchId) conditions.push(eq(fnbMenuScheduleRules.branchId, branchId));

        const rows = await db
            .select()
            .from(fnbMenuScheduleRules)
            .where(and(...conditions))
            .orderBy(
                asc(fnbMenuScheduleRules.productId),
                asc(fnbMenuScheduleRules.dayOfWeek),
                asc(fnbMenuScheduleRules.startTime)
            );

        return ok(c, rows);
    } catch (err: any) {
        console.error("[fnb/menu-schedules:list]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/fnb/menu-schedules
fnbRouter.post("/menu-schedules", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const body = await c.req.json().catch(() => null);

        const productId = body?.productId ? String(body.productId) : "";
        const dayOfWeek = Number(body?.dayOfWeek);
        const startTime = String(body?.startTime ?? "");
        const endTime = String(body?.endTime ?? "");
        const branchId = body?.branchId ? String(body.branchId) : null;

        if (!productId) return errors.badRequest(c, "productId is required");
        if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
            return errors.badRequest(c, "dayOfWeek must be 0-6");
        }
        if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || startTime >= endTime) {
            return errors.badRequest(c, "Invalid startTime/endTime");
        }

        const [created] = await db
            .insert(fnbMenuScheduleRules)
            .values({
                organizationId: orgId,
                productId,
                branchId,
                dayOfWeek,
                startTime,
                endTime,
                isActive: body?.isActive !== false,
            })
            .returning();

        return ok(c, created);
    } catch (err: any) {
        console.error("[fnb/menu-schedules:create]", err);
        return errors.internal(c, err.message);
    }
});

// PATCH /api/dashboard/fnb/menu-schedules
fnbRouter.patch("/menu-schedules", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const body = await c.req.json().catch(() => null);
        const id = body?.id ? String(body.id) : "";
        if (!id) return errors.badRequest(c, "id is required");

        const updates: any = {};
        if (body?.dayOfWeek !== undefined) {
            const dayOfWeek = Number(body.dayOfWeek);
            if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
                return errors.badRequest(c, "dayOfWeek must be 0-6");
            }
            updates.dayOfWeek = dayOfWeek;
        }
        if (body?.startTime !== undefined) updates.startTime = String(body.startTime);
        if (body?.endTime !== undefined) updates.endTime = String(body.endTime);
        if (updates.startTime || updates.endTime) {
            const start = updates.startTime ?? body?.currentStartTime;
            const end = updates.endTime ?? body?.currentEndTime;
            if (!TIME_RE.test(start) || !TIME_RE.test(end) || start >= end) {
                return errors.badRequest(c, "Invalid startTime/endTime");
            }
        }
        if (body?.isActive !== undefined) updates.isActive = Boolean(body.isActive);

        if (Object.keys(updates).length === 0) return errors.badRequest(c, "Tidak ada field yang diupdate");

        const [updated] = await db
            .update(fnbMenuScheduleRules)
            .set(updates)
            .where(and(eq(fnbMenuScheduleRules.organizationId, orgId), eq(fnbMenuScheduleRules.id, id)))
            .returning();

        if (!updated) return errors.notFound(c, "Menu schedule rule not found");
        return ok(c, updated);
    } catch (err: any) {
        console.error("[fnb/menu-schedules:update]", err);
        return errors.internal(c, err.message);
    }
});
