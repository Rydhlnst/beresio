import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { branchMembers, branches, member, orders, payments } from "@beresio/db";
import type { Context } from "hono";
import { getBranchAccessContext } from "./branch-access";

type AggregateRangeInput = {
    from?: Date | null;
    to?: Date | null;
};

type AggregateScopeInput = {
    branchIds?: string[];
};

export type OrganizationBranchAggregate = {
    totalBranches: number;
    activeBranches: number;
    activeStaff: number;
    revenueTotal: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
};

function uniqueBranchIds(branchIds: string[]) {
    return Array.from(new Set(branchIds.filter(Boolean)));
}

function buildPaymentConditions(orgId: string, branchIds: string[], range?: AggregateRangeInput) {
    const conditions = [
        eq(payments.organizationId, orgId),
        eq(payments.status, "SUCCESS"),
        inArray(payments.branchId, branchIds),
    ] as any[];

    if (range?.from) conditions.push(gte(payments.createdAt, range.from));
    if (range?.to) conditions.push(lte(payments.createdAt, range.to));
    return conditions;
}

function buildOrderConditions(orgId: string, branchIds: string[], range?: AggregateRangeInput) {
    const conditions = [
        eq(orders.organizationId, orgId),
        inArray(orders.branchId, branchIds),
    ] as any[];

    if (range?.from) conditions.push(gte(orders.createdAt, range.from));
    if (range?.to) conditions.push(lte(orders.createdAt, range.to));
    return conditions;
}

export async function resolveScopedBranchIds(
    c: Context,
    orgId: string,
    scopedBranchIds?: string[]
): Promise<string[]> {
    const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);
    const accessible = uniqueBranchIds(branchIds);
    if (accessible.length === 0 && !isOrgWide) return [];

    if (!scopedBranchIds || scopedBranchIds.length === 0) {
        return accessible;
    }

    const scopeSet = new Set(uniqueBranchIds(scopedBranchIds));
    return accessible.filter((branchId) => scopeSet.has(branchId));
}

export async function getOrganizationBranchAggregate(
    c: Context,
    orgId: string,
    options?: AggregateScopeInput & { range?: AggregateRangeInput }
): Promise<OrganizationBranchAggregate> {
    const db = c.get("db");
    const scopedBranchIds = await resolveScopedBranchIds(c, orgId, options?.branchIds);
    if (scopedBranchIds.length === 0) {
        return {
            totalBranches: 0,
            activeBranches: 0,
            activeStaff: 0,
            revenueTotal: 0,
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,
        };
    }

    const [branchRows, staffRows, paymentRows, orderRows] = await Promise.all([
        db
            .select({
                total: sql<number>`COUNT(*)`.as("total"),
                active: sql<number>`COUNT(*) FILTER (WHERE ${branches.isActive} = true)`.as("active"),
            })
            .from(branches)
            .where(and(eq(branches.organizationId, orgId), inArray(branches.id, scopedBranchIds))),
        db
            .select({
                total: sql<number>`COUNT(DISTINCT ${branchMembers.memberId})`.as("total"),
            })
            .from(branchMembers)
            .innerJoin(member, eq(branchMembers.memberId, member.id))
            .where(and(
                eq(branchMembers.organizationId, orgId),
                inArray(branchMembers.branchId, scopedBranchIds),
                eq(member.status, "active")
            )),
        db
            .select({
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.as("revenue"),
            })
            .from(payments)
            .where(and(...buildPaymentConditions(orgId, scopedBranchIds, options?.range))),
        db
            .select({
                total: sql<number>`COUNT(*)`.as("total"),
                completed: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'completed')`.as("completed"),
                cancelled: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'cancelled')`.as("cancelled"),
            })
            .from(orders)
            .where(and(...buildOrderConditions(orgId, scopedBranchIds, options?.range))),
    ]);

    return {
        totalBranches: Number(branchRows[0]?.total ?? 0),
        activeBranches: Number(branchRows[0]?.active ?? 0),
        activeStaff: Number(staffRows[0]?.total ?? 0),
        revenueTotal: Number(paymentRows[0]?.revenue ?? 0),
        totalOrders: Number(orderRows[0]?.total ?? 0),
        completedOrders: Number(orderRows[0]?.completed ?? 0),
        cancelledOrders: Number(orderRows[0]?.cancelled ?? 0),
    };
}
