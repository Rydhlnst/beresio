import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { branches, branchMembers, createDbNextjs, member, roles } from "@beresio/db";
import { getActiveBranchId } from "@/lib/branch-context.server";

type OrgMode = "single" | "multi";

type OrgRecord = {
    id: string;
    name: string;
    slug?: string | null;
    mode?: string | null;
};

type BranchRecord = {
    id: string;
    code: string;
    name: string;
};

type ResolveRoutingInput = {
    orgSlug?: string | null;
    branchSlug?: string | null;
    forceBranchPath?: boolean;
};

export type DashboardRoutingTarget = {
    orgId: string;
    orgSlug: string;
    mode: OrgMode;
    roleSlug: string | null;
    isOrgLevelRole: boolean;
    accessibleBranches: Array<{
        id: string;
        code: string;
        slug: string;
        name: string;
    }>;
    defaultBranchId: string | null;
    defaultBranchCode: string | null;
    targetPath: string;
};

const ORG_LEVEL_ROLE_SLUGS = new Set([
    "owner",
    "admin",
    "administrator",
    "super_admin",
    "superadmin",
    "org_admin",
    "organization_admin",
]);

function normalizeSlug(value: string | null | undefined) {
    if (!value) return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
}

function slugifyFromName(name: string) {
    const normalized = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    return normalized || "organization";
}

function normalizeMode(value: string | null | undefined): OrgMode {
    return value?.toLowerCase() === "multi" ? "multi" : "single";
}

function normalizeRoleSlug(value: string | null | undefined) {
    const normalized = normalizeSlug(value);
    return normalized ?? null;
}

function normalizeBranchCode(value: string | null | undefined) {
    const normalized = normalizeSlug(value);
    return normalized ?? null;
}

export function buildOrgDashboardPath(orgSlug: string) {
    return `/dashboard/${orgSlug}`;
}

export function buildBranchDashboardPath(orgSlug: string, branchCode: string) {
    return `/branch/${orgSlug}/${normalizeBranchCode(branchCode) ?? branchCode.toLowerCase()}`;
}

const resolveDashboardRoutingTargetCached = cache(async (
    requestedOrgSlug: string | null,
    requestedBranchSlug: string | null,
    forceBranchPath: boolean
): Promise<DashboardRoutingTarget | null> => {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();
    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) return null;

    const orgData = (await authInstance.api.listOrganizations({
        headers: reqHeaders,
    })) as OrgRecord[] | null;

    const organizations = orgData ?? [];
    if (organizations.length === 0) return null;

    const activeOrganizationId = (session as any)?.activeOrganizationId ?? organizations[0]?.id;

    const activeOrganization =
        (requestedOrgSlug
            ? organizations.find((org) => normalizeSlug(org.slug) === requestedOrgSlug)
            : null) ??
        organizations.find((org) => org.id === activeOrganizationId) ??
        organizations[0];

    if (!activeOrganization?.id) return null;

    const [membership] = await db
        .select({
            memberId: member.id,
            roleLegacy: member.role,
            roleSlug: roles.slug,
        })
        .from(member)
        .leftJoin(roles, eq(member.roleId, roles.id))
        .where(and(eq(member.organizationId, activeOrganization.id), eq(member.userId, session.user.id)))
        .limit(1);

    const roleSlug = normalizeRoleSlug(membership?.roleSlug ?? membership?.roleLegacy ?? null);
    const isOrgLevelRole = roleSlug ? ORG_LEVEL_ROLE_SLUGS.has(roleSlug) : false;

    let scopedBranches: BranchRecord[] = [];
    if (isOrgLevelRole) {
        scopedBranches = await db
            .select({
                id: branches.id,
                code: branches.code,
                name: branches.name,
            })
            .from(branches)
            .where(eq(branches.organizationId, activeOrganization.id))
            .orderBy(asc(branches.name));
    } else if (membership?.memberId) {
        scopedBranches = await db
            .select({
                id: branches.id,
                code: branches.code,
                name: branches.name,
            })
            .from(branchMembers)
            .innerJoin(branches, eq(branchMembers.branchId, branches.id))
            .where(and(
                eq(branchMembers.organizationId, activeOrganization.id),
                eq(branchMembers.memberId, membership.memberId)
            ))
            .orderBy(asc(branches.name));
    }

    if (scopedBranches.length === 0) {
        scopedBranches = await db
            .select({
                id: branches.id,
                code: branches.code,
                name: branches.name,
            })
            .from(branches)
            .where(eq(branches.organizationId, activeOrganization.id))
            .orderBy(asc(branches.name));
    }

    const activeBranchId = await getActiveBranchId();

    const defaultBranch =
        (requestedBranchSlug
            ? scopedBranches.find((branch) => normalizeBranchCode(branch.code) === requestedBranchSlug)
            : null) ??
        (activeBranchId
            ? scopedBranches.find((branch) => branch.id === activeBranchId)
            : null) ??
        scopedBranches[0] ??
        null;

    const mode = normalizeMode(activeOrganization.mode);
    const orgSlug = normalizeSlug(activeOrganization.slug) ?? slugifyFromName(activeOrganization.name);
    const defaultBranchCode = normalizeBranchCode(defaultBranch?.code);

    const targetPath = forceBranchPath
        ? defaultBranchCode
            ? buildBranchDashboardPath(orgSlug, defaultBranchCode)
            : "/onboarding/branch"
        : mode === "multi" && isOrgLevelRole
            ? buildOrgDashboardPath(orgSlug)
            : defaultBranchCode
                ? buildBranchDashboardPath(orgSlug, defaultBranchCode)
                : "/onboarding/branch";

    return {
        orgId: activeOrganization.id,
        orgSlug,
        mode,
        roleSlug,
        isOrgLevelRole,
        accessibleBranches: scopedBranches
            .map((branch) => ({
                id: branch.id,
                code: branch.code,
                slug: normalizeBranchCode(branch.code) ?? "",
                name: branch.name,
            }))
            .filter((branch) => branch.slug.length > 0),
        defaultBranchId: defaultBranch?.id ?? null,
        defaultBranchCode: defaultBranchCode ?? null,
        targetPath,
    };
});

export async function resolveDashboardRoutingTarget(
    input: ResolveRoutingInput = {}
): Promise<DashboardRoutingTarget | null> {
    const requestedOrgSlug = normalizeSlug(input.orgSlug);
    const requestedBranchSlug = normalizeBranchCode(input.branchSlug);
    const forceBranchPath = input.forceBranchPath === true;

    return resolveDashboardRoutingTargetCached(
        requestedOrgSlug,
        requestedBranchSlug,
        forceBranchPath
    );
}

export async function resolveCanonicalBranchPathByBranchId(branchId: string) {
    const target = await resolveDashboardRoutingTarget();
    if (!target) return null;

    const db = createDbNextjs(process.env.DATABASE_URL!);
    const [branchRow] = await db
        .select({
            id: branches.id,
            code: branches.code,
        })
        .from(branches)
        .where(and(eq(branches.id, branchId), eq(branches.organizationId, target.orgId)))
        .limit(1);

    const branchCode = normalizeBranchCode(branchRow?.code ?? null) ?? target.defaultBranchCode;
    if (!branchCode) return null;
    return buildBranchDashboardPath(target.orgSlug, branchCode);
}
