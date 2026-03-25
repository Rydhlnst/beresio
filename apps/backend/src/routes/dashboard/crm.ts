import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth";
import { getOrgId } from "../../lib/auth-context";
import { errors, ok } from "../../lib/errors";
import {
    and,
    eq,
    ilike,
    or,
    desc,
    asc,
    sql,
    count,
    inArray,
    isNull,
    gte,
} from "drizzle-orm";
import {
    customers,
    customerTags,
    customerTagLinks,
    customerNotes,
    customerInteractions,
    customerAnalytics,
} from "@beresio/db";
import { z } from "zod";

// Validation schemas defined locally to avoid module resolution issues
const genderEnum = z.enum(["male", "female", "other"]);
const customerStatusEnum = z.enum(["active", "inactive", "vip"]);
const customerInteractionTypeEnum = z.enum(["call", "visit", "order", "complaint", "feedback", "other"]);

const createCustomerSchema = z.object({
    name: z.string().min(1).max(150),
    phone: z.string().min(1).max(20),
    email: z.string().email().optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    birthDate: z.string().datetime().or(z.date()).optional().nullable(),
    gender: genderEnum.optional().nullable(),
    source: z.string().max(50).optional().nullable(),
    status: customerStatusEnum.optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    preferences: z.record(z.any()).optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

const createCustomerTagSchema = z.object({
    name: z.string().min(1).max(80),
    slug: z.string().min(1).max(80),
    color: z.string().max(24).optional(),
});

const createCustomerNoteSchema = z.object({
    note: z.string().min(1),
});

const createCustomerInteractionSchema = z.object({
    type: customerInteractionTypeEnum,
    notes: z.string().min(1),
    metadata: z.record(z.any()).optional(),
});

const listCustomersQuerySchema = z.object({
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("25"),
    search: z.string().optional(),
    tagId: z.string().uuid().optional(),
    status: customerStatusEnum.optional(),
    sortBy: z.enum(["name", "createdAt", "totalSpentRp", "lastOrderAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
};
type Variables = { db: any; user: any; session: any };

export const crmRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================

// GET /api/dashboard/crm/customers
// List customers with pagination, search, filter
crmRouter.get("/customers", authMiddleware, zValidator("query", listCustomersQuerySchema), async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const query = c.req.valid("query");
        const { page, limit, search, tagId, status, sortBy, sortOrder } = query;
        const offset = (page - 1) * limit;

        // Build conditions
        const conditions: any[] = [eq(customers.organizationId, orgId)];

        if (search) {
            const searchCondition = or(
                ilike(customers.name, `%${search}%`),
                ilike(customers.phone, `%${search}%`),
                ilike(customers.email, `%${search}%`)
            );
            if (searchCondition) conditions.push(searchCondition);
        }

        if (status) {
            conditions.push(eq(customers.status, status));
        }

        // Build order by
        let orderBy;
        if (sortBy === "name") {
            orderBy = sortOrder === "asc" ? asc(customers.name) : desc(customers.name);
        } else if (sortBy === "totalSpentRp") {
            orderBy = sortOrder === "asc" ? asc(customers.totalSpentRp) : desc(customers.totalSpentRp);
        } else if (sortBy === "lastOrderAt") {
            orderBy = sortOrder === "asc" ? asc(customerAnalytics.lastOrderAt) : desc(customerAnalytics.lastOrderAt);
        } else {
            orderBy = sortOrder === "asc" ? asc(customers.createdAt) : desc(customers.createdAt);
        }

        // Get total count
        const [{ count: total }] = await db
            .select({ count: count() })
            .from(customers)
            .where(and(...conditions));

        // Get customers with analytics
        let customerQuery = db
            .select({
                customer: customers,
                analytics: {
                    totalOrders: customerAnalytics.totalOrders,
                    totalSpent: customerAnalytics.totalSpent,
                    lastOrderAt: customerAnalytics.lastOrderAt,
                },
            })
            .from(customers)
            .leftJoin(customerAnalytics, eq(customers.id, customerAnalytics.customerId))
            .where(and(...conditions));

        // Filter by tag if specified
        if (tagId) {
            const customerIdsWithTag = db
                .select({ customerId: customerTagLinks.customerId })
                .from(customerTagLinks)
                .where(
                    and(
                        eq(customerTagLinks.tagId, tagId),
                        eq(customerTagLinks.organizationId, orgId)
                    )
                );
            customerQuery = customerQuery.where(inArray(customers.id, customerIdsWithTag));
        }

        const rows = await customerQuery
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        // Get tags for each customer
        const customerIds = rows.map((r: any) => r.customer.id);
        const tags =
            customerIds.length > 0
                ? await db
                    .select({
                        customerId: customerTagLinks.customerId,
                        tag: {
                            id: customerTags.id,
                            name: customerTags.name,
                            slug: customerTags.slug,
                            color: customerTags.color,
                        },
                    })
                    .from(customerTagLinks)
                    .innerJoin(customerTags, eq(customerTagLinks.tagId, customerTags.id))
                    .where(
                        and(
                            inArray(customerTagLinks.customerId, customerIds),
                            eq(customerTagLinks.organizationId, orgId)
                        )
                    )
                : [];

        // Group tags by customer
        interface TagInfo { id: string; name: string; slug: string; color: string | null }
        const tagsByCustomer: Record<string, TagInfo[]> = {};
        for (const item of tags) {
            if (!tagsByCustomer[item.customerId]) tagsByCustomer[item.customerId] = [];
            tagsByCustomer[item.customerId].push(item.tag);
        }

        const data = rows.map((row: any) => ({
            ...row.customer,
            analytics: row.analytics,
            tags: tagsByCustomer[row.customer.id] || [],
        }));

        return ok(c, {
            data,
            meta: {
                total: Number(total),
                page,
                limit,
                totalPages: Math.ceil(Number(total) / limit),
            },
        });
    } catch (err: any) {
        console.error("[crm/customers/list]", err);
        return errors.internal(c, err.message);
    }
});

// GET /api/dashboard/crm/customers/:id
// Get single customer with details
crmRouter.get("/customers/:id", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const customerId = c.req.param("id");

        // Get customer
        const [customerRow] = await db
            .select()
            .from(customers)
            .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
            .limit(1);

        if (!customerRow) return errors.notFound(c, "Customer not found");

        // Get related data in parallel
        const [tags, notes, interactions, analytics] = await Promise.all([
            db
                .select({
                    id: customerTags.id,
                    name: customerTags.name,
                    slug: customerTags.slug,
                    color: customerTags.color,
                })
                .from(customerTagLinks)
                .innerJoin(customerTags, eq(customerTagLinks.tagId, customerTags.id))
                .where(
                    and(
                        eq(customerTagLinks.customerId, customerId),
                        eq(customerTagLinks.organizationId, orgId)
                    )
                ),
            db
                .select({
                    id: customerNotes.id,
                    note: customerNotes.note,
                    createdAt: customerNotes.createdAt,
                    createdBy: customerNotes.createdBy,
                })
                .from(customerNotes)
                .where(
                    and(
                        eq(customerNotes.customerId, customerId),
                        eq(customerNotes.organizationId, orgId)
                    )
                )
                .orderBy(desc(customerNotes.createdAt)),
            db
                .select({
                    id: customerInteractions.id,
                    type: customerInteractions.type,
                    notes: customerInteractions.notes,
                    metadata: customerInteractions.metadata,
                    createdAt: customerInteractions.createdAt,
                    createdBy: customerInteractions.createdBy,
                })
                .from(customerInteractions)
                .where(
                    and(
                        eq(customerInteractions.customerId, customerId),
                        eq(customerInteractions.organizationId, orgId)
                    )
                )
                .orderBy(desc(customerInteractions.createdAt)),
            db
                .select()
                .from(customerAnalytics)
                .where(
                    and(
                        eq(customerAnalytics.customerId, customerId),
                        eq(customerAnalytics.organizationId, orgId)
                    )
                )
                .limit(1),
        ]);

        return ok(c, {
            ...customerRow,
            tags,
            notes,
            interactions,
            analytics: analytics[0] || null,
        });
    } catch (err: any) {
        console.error("[crm/customers/detail]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/crm/customers
// Create new customer
crmRouter.post(
    "/customers",
    authMiddleware,
    zValidator("json", createCustomerSchema),
    async (c) => {
        try {
            const db = c.get("db");
            const user = c.get("user");
            let orgId: string;
            try {
                orgId = await getOrgId(c);
            } catch {
                return errors.unauthorized(c, "No organization context");
            }

            const body = c.req.valid("json");

            // Create customer
            const [created] = await db
                .insert(customers)
                .values({
                    organizationId: orgId,
                    name: body.name,
                    phone: body.phone,
                    email: body.email ?? null,
                    address: body.address ?? null,
                    birthDate: body.birthDate ? new Date(body.birthDate) : null,
                    gender: body.gender ?? null,
                    source: body.source ?? null,
                    status: body.status ?? "active",
                    preferences: body.preferences ?? {},
                    loyaltyPoints: 0,
                    loyaltyTier: "regular",
                    totalSpentRp: 0,
                })
                .returning();

            // Link tags if provided
            if (body.tagIds && body.tagIds.length > 0) {
                await db.insert(customerTagLinks).values(
                    body.tagIds.map((tagId: string) => ({
                        organizationId: orgId,
                        customerId: created.id,
                        tagId,
                    }))
                );
            }

            // Create initial analytics record
            await db.insert(customerAnalytics).values({
                organizationId: orgId,
                customerId: created.id,
                totalOrders: 0,
                totalSpent: 0,
                averageOrderValue: 0,
            });

            return ok(c, created);
        } catch (err: any) {
            console.error("[crm/customers/create]", err);
            return errors.internal(c, err.message);
        }
    }
);

// PATCH /api/dashboard/crm/customers/:id
// Update customer
crmRouter.patch(
    "/customers/:id",
    authMiddleware,
    zValidator("json", updateCustomerSchema),
    async (c) => {
        try {
            const db = c.get("db");
            let orgId: string;
            try {
                orgId = await getOrgId(c);
            } catch {
                return errors.unauthorized(c, "No organization context");
            }

            const customerId = c.req.param("id");
            const body = c.req.valid("json");

            // Build update values
            const updateValues: any = {};
            if (body.name !== undefined) updateValues.name = body.name;
            if (body.phone !== undefined) updateValues.phone = body.phone;
            if (body.email !== undefined) updateValues.email = body.email;
            if (body.address !== undefined) updateValues.address = body.address;
            if (body.birthDate !== undefined)
                updateValues.birthDate = body.birthDate ? new Date(body.birthDate) : null;
            if (body.gender !== undefined) updateValues.gender = body.gender;
            if (body.source !== undefined) updateValues.source = body.source;
            if (body.status !== undefined) updateValues.status = body.status;
            if (body.preferences !== undefined) updateValues.preferences = body.preferences;

            const [updated] = await db
                .update(customers)
                .set(updateValues)
                .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
                .returning();

            if (!updated) return errors.notFound(c, "Customer not found");

            // Update tags if provided
            if (body.tagIds !== undefined) {
                // Remove existing tags
                await db
                    .delete(customerTagLinks)
                    .where(
                        and(
                            eq(customerTagLinks.customerId, customerId),
                            eq(customerTagLinks.organizationId, orgId)
                        )
                    );

                // Add new tags
                if (body.tagIds && body.tagIds.length > 0) {
                    await db.insert(customerTagLinks).values(
                        body.tagIds.map((tagId: string) => ({
                            organizationId: orgId,
                            customerId,
                            tagId,
                        }))
                    );
                }
            }

            return ok(c, updated);
        } catch (err: any) {
            console.error("[crm/customers/update]", err);
            return errors.internal(c, err.message);
        }
    }
);

// DELETE /api/dashboard/crm/customers/:id
// Delete customer
crmRouter.delete("/customers/:id", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const customerId = c.req.param("id");

        // Delete customer (cascade will handle related records)
        const [deleted] = await db
            .delete(customers)
            .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
            .returning();

        if (!deleted) return errors.notFound(c, "Customer not found");

        return ok(c, { success: true });
    } catch (err: any) {
        console.error("[crm/customers/delete]", err);
        return errors.internal(c, err.message);
    }
});

// ============================================================================
// CUSTOMER NOTES ROUTES
// ============================================================================

// GET /api/dashboard/crm/customers/:id/notes
// List customer notes
crmRouter.get("/customers/:id/notes", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const customerId = c.req.param("id");

        const notes = await db
            .select({
                id: customerNotes.id,
                note: customerNotes.note,
                createdAt: customerNotes.createdAt,
                createdBy: customerNotes.createdBy,
            })
            .from(customerNotes)
            .where(
                and(
                    eq(customerNotes.customerId, customerId),
                    eq(customerNotes.organizationId, orgId)
                )
            )
            .orderBy(desc(customerNotes.createdAt));

        return ok(c, notes);
    } catch (err: any) {
        console.error("[crm/customers/notes/list]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/crm/customers/:id/notes
// Add note to customer
crmRouter.post(
    "/customers/:id/notes",
    authMiddleware,
    zValidator("json", createCustomerNoteSchema),
    async (c) => {
        try {
            const db = c.get("db");
            const user = c.get("user");
            let orgId: string;
            try {
                orgId = await getOrgId(c);
            } catch {
                return errors.unauthorized(c, "No organization context");
            }

            const customerId = c.req.param("id");
            const body = c.req.valid("json");

            const [created] = await db
                .insert(customerNotes)
                .values({
                    organizationId: orgId,
                    customerId,
                    note: body.note,
                    createdBy: user?.id,
                })
                .returning();

            return ok(c, created);
        } catch (err: any) {
            console.error("[crm/customers/notes/create]", err);
            return errors.internal(c, err.message);
        }
    }
);

// DELETE /api/dashboard/crm/notes/:noteId
// Delete a note
crmRouter.delete("/notes/:noteId", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const noteId = c.req.param("noteId");

        const [deleted] = await db
            .delete(customerNotes)
            .where(and(eq(customerNotes.id, noteId), eq(customerNotes.organizationId, orgId)))
            .returning();

        if (!deleted) return errors.notFound(c, "Note not found");

        return ok(c, { success: true });
    } catch (err: any) {
        console.error("[crm/notes/delete]", err);
        return errors.internal(c, err.message);
    }
});

// ============================================================================
// CUSTOMER INTERACTIONS ROUTES
// ============================================================================

// GET /api/dashboard/crm/customers/:id/interactions
// List customer interactions
crmRouter.get("/customers/:id/interactions", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const customerId = c.req.param("id");

        const interactions = await db
            .select({
                id: customerInteractions.id,
                type: customerInteractions.type,
                notes: customerInteractions.notes,
                metadata: customerInteractions.metadata,
                createdAt: customerInteractions.createdAt,
                createdBy: customerInteractions.createdBy,
            })
            .from(customerInteractions)
            .where(
                and(
                    eq(customerInteractions.customerId, customerId),
                    eq(customerInteractions.organizationId, orgId)
                )
            )
            .orderBy(desc(customerInteractions.createdAt));

        return ok(c, interactions);
    } catch (err: any) {
        console.error("[crm/customers/interactions/list]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/crm/customers/:id/interactions
// Add interaction to customer
crmRouter.post(
    "/customers/:id/interactions",
    authMiddleware,
    zValidator("json", createCustomerInteractionSchema),
    async (c) => {
        try {
            const db = c.get("db");
            const user = c.get("user");
            let orgId: string;
            try {
                orgId = await getOrgId(c);
            } catch {
                return errors.unauthorized(c, "No organization context");
            }

            const customerId = c.req.param("id");
            const body = c.req.valid("json");

            const [created] = await db
                .insert(customerInteractions)
                .values({
                    organizationId: orgId,
                    customerId,
                    type: body.type,
                    notes: body.notes,
                    metadata: body.metadata ?? {},
                    createdBy: user?.id,
                })
                .returning();

            // Update analytics interaction count
            await db
                .update(customerAnalytics)
                .set({
                    totalInteractions: sql`${customerAnalytics.totalInteractions} + 1`,
                    lastInteractionAt: new Date(),
                })
                .where(
                    and(
                        eq(customerAnalytics.customerId, customerId),
                        eq(customerAnalytics.organizationId, orgId)
                    )
                );

            return ok(c, created);
        } catch (err: any) {
            console.error("[crm/customers/interactions/create]", err);
            return errors.internal(c, err.message);
        }
    }
);

// ============================================================================
// CUSTOMER TAGS ROUTES
// ============================================================================

// GET /api/dashboard/crm/tags
// List all tags
crmRouter.get("/tags", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const tags = await db
            .select({
                id: customerTags.id,
                name: customerTags.name,
                slug: customerTags.slug,
                color: customerTags.color,
                createdAt: customerTags.createdAt,
            })
            .from(customerTags)
            .where(eq(customerTags.organizationId, orgId))
            .orderBy(customerTags.name);

        // Get usage count for each tag
        const tagIds = tags.map((t: {id: string}) => t.id);
        const usageCounts =
            tagIds.length > 0
                ? await db
                    .select({
                        tagId: customerTagLinks.tagId,
                        count: count(),
                    })
                    .from(customerTagLinks)
                    .where(
                        and(
                            inArray(customerTagLinks.tagId, tagIds),
                            eq(customerTagLinks.organizationId, orgId)
                        )
                    )
                    .groupBy(customerTagLinks.tagId)
                : [];

        const countByTag: Record<string, number> = {};
        for (const item of usageCounts) {
            countByTag[item.tagId] = Number(item.count);
        }

        return ok(c, tags.map((tag: {id: string, name: string, slug: string, color: string | null, createdAt: Date}) => ({ ...tag, usageCount: countByTag[tag.id] || 0 })));
    } catch (err: any) {
        console.error("[crm/tags/list]", err);
        return errors.internal(c, err.message);
    }
});

// POST /api/dashboard/crm/tags
// Create new tag
crmRouter.post("/tags", authMiddleware, zValidator("json", createCustomerTagSchema), async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const body = c.req.valid("json");

        const [created] = await db
            .insert(customerTags)
            .values({
                organizationId: orgId,
                name: body.name,
                slug: body.slug,
                color: body.color ?? null,
            })
            .returning();

        return ok(c, created);
    } catch (err: any) {
        console.error("[crm/tags/create]", err);
        return errors.internal(c, err.message);
    }
});

// PATCH /api/dashboard/crm/tags/:id
// Update tag
crmRouter.patch(
    "/tags/:id",
    authMiddleware,
    zValidator("json", createCustomerTagSchema.partial()),
    async (c) => {
        try {
            const db = c.get("db");
            let orgId: string;
            try {
                orgId = await getOrgId(c);
            } catch {
                return errors.unauthorized(c, "No organization context");
            }

            const tagId = c.req.param("id");
            const body = c.req.valid("json");

            const [updated] = await db
                .update(customerTags)
                .set(body)
                .where(and(eq(customerTags.id, tagId), eq(customerTags.organizationId, orgId)))
                .returning();

            if (!updated) return errors.notFound(c, "Tag not found");

            return ok(c, updated);
        } catch (err: any) {
            console.error("[crm/tags/update]", err);
            return errors.internal(c, err.message);
        }
    }
);

// DELETE /api/dashboard/crm/tags/:id
// Delete tag
crmRouter.delete("/tags/:id", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const tagId = c.req.param("id");

        const [deleted] = await db
            .delete(customerTags)
            .where(and(eq(customerTags.id, tagId), eq(customerTags.organizationId, orgId)))
            .returning();

        if (!deleted) return errors.notFound(c, "Tag not found");

        return ok(c, { success: true });
    } catch (err: any) {
        console.error("[crm/tags/delete]", err);
        return errors.internal(c, err.message);
    }
});

// ============================================================================
// CRM ANALYTICS ROUTES
// ============================================================================

// GET /api/dashboard/crm/analytics/overview
// Get CRM overview analytics
crmRouter.get("/analytics/overview", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const period = c.req.query("period") || "30d";
        const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Get total customers
        const [{ count: totalCustomers }] = await db
            .select({ count: count() })
            .from(customers)
            .where(eq(customers.organizationId, orgId));

        // Get new customers this month
        const [{ count: newCustomersThisMonth }] = await db
            .select({ count: count() })
            .from(customers)
            .where(
                and(
                    eq(customers.organizationId, orgId),
                    gte(customers.createdAt, cutoffDate)
                )
            );

        // Get customers by status
        const statusCounts = await db
            .select({
                status: customers.status,
                count: count(),
            })
            .from(customers)
            .where(eq(customers.organizationId, orgId))
            .groupBy(customers.status);

        const activeCustomers =
            statusCounts.find((s: any) => s.status === "active")?.count || 0;
        const vipCustomers = statusCounts.find((s: any) => s.status === "vip")?.count || 0;
        const inactiveCustomers =
            statusCounts.find((s: any) => s.status === "inactive")?.count || 0;

        // Get average lifetime value
        const [{ avg: avgLifetimeValue }] = await db
            .select({ avg: sql<number>`COALESCE(AVG(${customerAnalytics.totalSpent}), 0)` })
            .from(customerAnalytics)
            .where(eq(customerAnalytics.organizationId, orgId));

        // Get top customers
        const topCustomers = await db
            .select({
                id: customers.id,
                name: customers.name,
                totalSpent: customerAnalytics.totalSpent,
                totalOrders: customerAnalytics.totalOrders,
            })
            .from(customers)
            .innerJoin(customerAnalytics, eq(customers.id, customerAnalytics.customerId))
            .where(eq(customers.organizationId, orgId))
            .orderBy(desc(customerAnalytics.totalSpent))
            .limit(10);

        return ok(c, {
            totalCustomers: Number(totalCustomers),
            newCustomersThisMonth: Number(newCustomersThisMonth),
            activeCustomers: Number(activeCustomers),
            vipCustomers: Number(vipCustomers),
            inactiveCustomers: Number(inactiveCustomers),
            averageLifetimeValue: Math.round(avgLifetimeValue || 0),
            topCustomers: topCustomers.map((c: {id: string, name: string, totalSpent: number | null, totalOrders: number | null}) => ({
                id: c.id,
                name: c.name,
                totalSpent: Number(c.totalSpent || 0),
                totalOrders: Number(c.totalOrders || 0),
            })),
        });
    } catch (err: any) {
        console.error("[crm/analytics/overview]", err);
        return errors.internal(c, err.message);
    }
});

// GET /api/dashboard/crm/analytics/customer/:id
// Get customer-specific analytics
crmRouter.get("/analytics/customer/:id", authMiddleware, async (c) => {
    try {
        const db = c.get("db");
        let orgId: string;
        try {
            orgId = await getOrgId(c);
        } catch {
            return errors.unauthorized(c, "No organization context");
        }

        const customerId = c.req.param("id");

        // Get customer with analytics
        const [result] = await db
            .select({
                customer: customers,
                analytics: customerAnalytics,
            })
            .from(customers)
            .leftJoin(customerAnalytics, eq(customers.id, customerAnalytics.customerId))
            .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
            .limit(1);

        if (!result) return errors.notFound(c, "Customer not found");

        // Get recent interactions
        const interactions = await db
            .select({
                id: customerInteractions.id,
                type: customerInteractions.type,
                notes: customerInteractions.notes,
                createdAt: customerInteractions.createdAt,
            })
            .from(customerInteractions)
            .where(
                and(
                    eq(customerInteractions.customerId, customerId),
                    eq(customerInteractions.organizationId, orgId)
                )
            )
            .orderBy(desc(customerInteractions.createdAt))
            .limit(10);

        return ok(c, {
            customer: result.customer,
            analytics: result.analytics,
            interactions,
        });
    } catch (err: any) {
        console.error("[crm/analytics/customer]", err);
        return errors.internal(c, err.message);
    }
});
