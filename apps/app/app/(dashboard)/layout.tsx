import { auth } from "@/lib/auth";
import { branches, createDbNextjs, organization } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { BusinessNavResponse, BusinessNavItem } from "@/components/dashboard/layout/nav-config";
import { DashboardShell } from "@/components/dashboard/layout/dashboard-shell";
import { eq, sql } from "drizzle-orm";
import { buildBranchDashboardPath, buildOrgDashboardPath, resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

type OrgRecord = {
    id: string;
    name: string;
    logoUrl?: string | null;
    logo?: string | null;
    subscriptionPlan?: string | null;
    businessType?: string | null;
};

function cloneNavItem(item: BusinessNavItem): BusinessNavItem {
    return {
        ...item,
        submenu: item.submenu?.map(cloneNavItem),
    };
}

function parseMetadata(metadata: string | null | undefined): Record<string, unknown> {
    if (!metadata) return {};
    try {
        return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
        return {};
    }
}

function normalizeNavItems(
    items: BusinessNavItem[],
    options: {
        orgSlug: string;
        orgPath: string;
        branchPath: string;
        mode: "single" | "multi";
        isOrgLevelRole: boolean;
        branches: Array<{ id: string; slug: string; name: string }>;
    }
) {
    const mapped = items
        .map((item) => cloneNavItem(item))
        .filter((item) => {
            if (item.id === "cabang" && (!options.isOrgLevelRole || options.mode !== "multi")) {
                return false;
            }
            return true;
        })
        .map((item) => {
            if (item.id === "dashboard") {
                item.path = options.mode === "multi" && options.isOrgLevelRole
                    ? options.orgPath
                    : options.branchPath;
            }
            if (item.id === "cabang" && options.mode === "multi" && options.isOrgLevelRole) {
                item.path = options.branches[0]?.slug
                    ? buildBranchDashboardPath(options.orgSlug, options.branches[0].slug)
                    : options.orgPath;
                item.submenu = options.branches.map((branch) => ({
                    id: `branch-${branch.id}`,
                    label: branch.name,
                    icon: "building",
                    path: buildBranchDashboardPath(options.orgSlug, branch.slug),
                }));
            }
            return item;
        });

    return mapped;
}

async function readJsonBodySafe<T>(response: Response): Promise<{ data: T | null; rawText: string }> {
    const rawText = await response.text();
    if (!rawText) return { data: null, rawText: "" };

    try {
        return { data: JSON.parse(rawText) as T, rawText };
    } catch {
        return { data: null, rawText };
    }
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
        redirect("/login");
    }

    const orgData = await authInstance.api.listOrganizations({ headers: reqHeaders });
    const organizations = ((orgData ?? []) as OrgRecord[]).map((org) => ({
        id: org.id,
        name: org.name,
        plan: org.subscriptionPlan ?? "starter",
        logoUrl: org.logoUrl ?? org.logo ?? null,
        businessType: org.businessType ?? null,
    }));

    // Dashboard access rule: Must have at least one organization
    if (organizations.length === 0) {
        redirect("/onboarding/org");
    }

    const activeOrganizationId =
        (session as any)?.activeOrganizationId ?? organizations[0]?.id;
    const activeOrganization =
        organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0];
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
    let navItems: BusinessNavItem[] = [];
    let navBaseItems: BusinessNavItem[] = [];
    let navVerticalItems: BusinessNavItem[] = [];
    let navLoaded = false;
    let businessName: string | null = activeOrganization?.name ?? null;
    let businessType: string | null = activeOrganization?.businessType ?? null;
    let roleName: string | null = null;
    let permissions: string[] = [];

    if (activeOrganization?.id) {
        try {
            const navRes = await fetch(
                `${apiBaseUrl}/api/businesses/${activeOrganization.id}/navigation`,
                {
                    headers: {
                        cookie,
                        accept: "application/json",
                    },
                    cache: "no-store",
                }
            );

            const { data: navBody, rawText } = await readJsonBodySafe<{ data?: BusinessNavResponse }>(navRes);

            if (navRes.ok && navBody?.data) {
                const navData = navBody.data;
                navItems = navData.navigation ?? [];
                navBaseItems = navData.navigationBase ?? [];
                navVerticalItems = navData.navigationVertical ?? [];
                businessName = navData.business?.name ?? businessName;
                businessType = navData.business?.type ?? businessType;
                roleName = navData.role?.name ?? roleName;
                permissions = navData.permissions ?? permissions;
            } else {
                const contentType = navRes.headers.get("content-type") ?? "unknown";
                const preview = rawText.slice(0, 280);
                console.error(
                    "Failed to fetch business navigation:",
                    `status=${navRes.status}`,
                    `contentType=${contentType}`,
                    preview
                );
            }
        } catch (error) {
            console.error("Failed to fetch business navigation (request error):", error);
        }
        navLoaded = true;
    }

    const [orgMeta] = activeOrganization?.id
        ? await db
            .select({ metadata: organization.metadata })
            .from(organization)
            .where(eq(organization.id, activeOrganization.id))
            .limit(1)
        : [{ metadata: null }];

    const metadata = parseMetadata(orgMeta?.metadata ?? null);
    const onboardingMeta = (metadata.onboarding && typeof metadata.onboarding === "object")
        ? (metadata.onboarding as Record<string, unknown>)
        : {};
    const modeSelected = onboardingMeta.modeSelected === true;

    const branchCountRows = activeOrganization?.id
        ? await db
            .select({ count: sql<number>`count(*)` })
            .from(branches)
            .where(eq(branches.organizationId, activeOrganization.id))
        : [{ count: 0 }];

    const hasBranch = Number(branchCountRows[0]?.count ?? 0) > 0;

    if (!hasBranch) {
        if (!modeSelected) {
            redirect("/onboarding/mode");
        }
        redirect("/onboarding/branch");
    }

    const orgPath = buildOrgDashboardPath(routing.orgSlug);
    const branchPath = routing.defaultBranchCode
        ? buildBranchDashboardPath(routing.orgSlug, routing.defaultBranchCode)
        : routing.targetPath;

    const navOptions = {
        orgSlug: routing.orgSlug,
        orgPath,
        branchPath,
        mode: routing.mode,
        isOrgLevelRole: routing.isOrgLevelRole,
        branches: routing.accessibleBranches.map((branch) => ({
            id: branch.id,
            slug: branch.slug,
            name: branch.name,
        })),
    };

    navItems = normalizeNavItems(navItems, navOptions);
    navBaseItems = normalizeNavItems(navBaseItems, navOptions);
    navVerticalItems = normalizeNavItems(navVerticalItems, navOptions);

    const activePlan = activeOrganization?.plan ?? "starter";

    return (
        <DashboardShell
            organizationName={businessName ?? "Organisasi"}
            roleName={roleName}
            permissions={permissions}
            user={{
                name: session.user.name ?? "Owner",
                email: session.user.email ?? "",
                avatar: session.user.image ?? "",
            }}
            plan={activePlan}
            organizations={organizations}
            activeOrganizationId={activeOrganization?.id}
            navItems={navItems}
            navBaseItems={navBaseItems}
            navVerticalItems={navVerticalItems}
            isNavLoading={!navLoaded}
            businessName={businessName}
            businessType={businessType}
        >
            {children}
        </DashboardShell>
    );
}
