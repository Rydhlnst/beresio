import { and, eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { member, rolePermissions, roles } from "@beresio/db";
import { errors } from "./errors";
import { getOrgId, getUserId } from "./auth-context";
import { getBranchAccessContext, hasBranchAccess } from "./branch-access";

const ORG_WIDE_ROLE_SLUGS = new Set([
    "owner",
    "admin",
    "administrator",
    "super_admin",
    "superadmin",
    "org_admin",
    "organization_admin",
]);

function normalizeLegacyRoles(input: unknown): string[] {
    if (typeof input !== "string") return [];
    const trimmed = input.trim();
    if (!trimmed) return [];
    return trimmed
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

async function resolveMemberContext(c: any, orgId: string) {
    const db = c.get("db");
    const userId = getUserId(c);

    const [membership] = await db
        .select({
            roleId: member.roleId,
            roleLegacy: member.role,
            roleSlug: roles.slug,
            roleName: roles.name,
        })
        .from(member)
        .leftJoin(roles, eq(member.roleId, roles.id))
        .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
        .limit(1);

    if (!membership) return null;

    const normalizedRoleSlug = membership.roleSlug?.toLowerCase().trim() ?? "";
    const legacyRoles = normalizeLegacyRoles(membership.roleLegacy);
    const roleName = membership.roleName?.toLowerCase().trim() ?? "";
    const roleSlugs = new Set<string>([
        ...legacyRoles,
        ...(normalizedRoleSlug ? [normalizedRoleSlug] : []),
        ...(roleName ? [roleName] : []),
    ]);

    const isOrgWide = Array.from(roleSlugs).some((slug) => ORG_WIDE_ROLE_SLUGS.has(slug));

    const permissionRows = membership.roleId
        ? await db
            .select({ permission: rolePermissions.permission })
            .from(rolePermissions)
            .where(and(
                eq(rolePermissions.organizationId, orgId),
                eq(rolePermissions.roleId, membership.roleId)
            ))
        : [];

    const permissionSet = new Set<string>(permissionRows.map((row: any) => String(row.permission)));
    return { isOrgWide, permissionSet };
}

export const requireOrganization = createMiddleware(async (c, next) => {
    try {
        const orgId = await getOrgId(c);
        c.set("orgId", orgId);
        await next();
    } catch {
        return errors.unauthorized(c, "No organization context");
    }
});

export type BranchScope = {
    isOrgWide: boolean;
    accessibleBranchIds: string[];
    requestedBranchIds: string[] | null;
    effectiveBranchIds: string[] | null;
};

export type AccessScope = {
    orgId: string;
    isOrgWide: boolean;
    accessibleBranchIds: string[];
    requestedBranchId: string | null;
    scopedBranchIds: string[];
};

type ResolveAccessScopeOptions = {
    requestedBranchId?: string | null;
    requireBranchAccess?: boolean;
    noBranchAccessMessage?: string;
    noAccessToBranchMessage?: string;
};

function normalizeBranchIds(input: string | string[] | null | undefined): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((item) => item.trim()).filter(Boolean);
    return [input.trim()].filter(Boolean);
}

function normalizeBranchId(input: string | null | undefined): string | null {
    if (!input) return null;
    const normalized = input.trim();
    return normalized.length > 0 ? normalized : null;
}

export async function resolveAccessScope(
    c: any,
    options: ResolveAccessScopeOptions = {}
): Promise<{ ok: true; value: AccessScope } | { ok: false; response: Response }> {
    const requireBranchAccess = options.requireBranchAccess ?? true;
    const requestedBranchId = normalizeBranchId(options.requestedBranchId);

    let orgId: string;
    try {
        orgId = await getOrgId(c);
    } catch {
        return { ok: false, response: errors.unauthorized(c, "No organization context") };
    }

    const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId);

    if (!isOrgWide && branchIds.length === 0 && requireBranchAccess) {
        return {
            ok: false,
            response: errors.forbidden(c, options.noBranchAccessMessage ?? "No branch access"),
        };
    }

    if (requestedBranchId && !hasBranchAccess(branchIds, requestedBranchId)) {
        return {
            ok: false,
            response: errors.forbidden(c, options.noAccessToBranchMessage ?? "No access to branch"),
        };
    }

    return {
        ok: true,
        value: {
            orgId,
            isOrgWide,
            accessibleBranchIds: branchIds,
            requestedBranchId,
            scopedBranchIds: requestedBranchId ? [requestedBranchId] : branchIds,
        },
    };
}

async function resolveBranchScope(
    c: any,
    orgId: string,
    input: string | string[] | null | undefined,
): Promise<BranchScope | null> {
    const requestedBranchIds = normalizeBranchIds(input);
    const access = await getBranchAccessContext(c, orgId);
    if (!access.isOrgWide && access.branchIds.length === 0) return null;

    if (!access.isOrgWide && requestedBranchIds.length > 0) {
        const unauthorized = requestedBranchIds.find((branchId) => !access.branchIds.includes(branchId));
        if (unauthorized) return null;
    }

    const effectiveBranchIds = requestedBranchIds.length > 0
        ? requestedBranchIds
        : (access.isOrgWide ? null : access.branchIds);

    return {
        isOrgWide: access.isOrgWide,
        accessibleBranchIds: access.branchIds,
        requestedBranchIds: requestedBranchIds.length > 0 ? requestedBranchIds : null,
        effectiveBranchIds,
    };
}

export function getBranchScope(c: any, key = "branchScope"): BranchScope {
    return c.get(key) as BranchScope;
}

export async function ensureBranchAccessible(c: any, orgId: string, branchId?: string | null) {
    const scope = await resolveBranchScope(c, orgId, branchId ?? null);
    if (!scope) return errors.forbidden(c, "No access to branch");
    return null;
}

export function requireBranchAccess(
    resolveBranchIds: (c: any) => Promise<string | string[] | null | undefined> | string | string[] | null | undefined,
    options?: { scopeKey?: string; allowMissing?: boolean }
) {
    const scopeKey = options?.scopeKey ?? "branchScope";
    const allowMissing = options?.allowMissing ?? false;

    return createMiddleware(async (c, next) => {
        const orgId = (c.get("orgId") as string | undefined) ?? await getOrgId(c);
        const resolved = await resolveBranchIds(c);
        const normalized = normalizeBranchIds(resolved);

        if (normalized.length === 0 && !allowMissing) {
            return errors.forbidden(c, "No access to branch");
        }

        const scope = await resolveBranchScope(c, orgId, normalized.length > 0 ? normalized : null);
        if (!scope) {
            return errors.forbidden(c, "No access to branch");
        }

        c.set(scopeKey, scope);
        await next();
    });
}

export function requirePermission(...permissionsAny: string[]) {
    return createMiddleware(async (c, next) => {
        if (permissionsAny.length === 0) {
            await next();
            return;
        }

        const orgId = (c.get("orgId") as string | undefined) ?? await getOrgId(c);
        const cacheKey = `__perm_ctx:${orgId}`;
        let context = c.get(cacheKey) as
            | { isOrgWide: boolean; permissionSet: Set<string> }
            | undefined;

        if (!context) {
            const resolved = await resolveMemberContext(c, orgId);
            if (!resolved) return errors.forbidden(c, "Member not found in organization");
            context = resolved;
            c.set(cacheKey, context);
        }

        if (context.isOrgWide) {
            await next();
            return;
        }

        const allowed = permissionsAny.some((permission) => context!.permissionSet.has(permission));
        if (!allowed) {
            return errors.forbidden(c, "Missing required permission");
        }

        await next();
    });
}
