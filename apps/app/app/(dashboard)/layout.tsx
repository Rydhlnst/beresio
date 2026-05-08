import { auth } from "@/lib/auth";
import { branches, createDbNextjs, invitation, organization, products, transactions } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { BusinessNavResponse, BusinessNavItem } from "@/components/dashboard/layout/nav-config";
import { DashboardShell } from "@/components/dashboard/layout/dashboard-shell";
import { eq, sql } from "drizzle-orm";
import { buildBranchDashboardPath, buildOrgDashboardPath, resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";
import { getSafeApiBaseUrl } from "@/lib/safe-api-url";
import type { DashboardOnboardingState } from "@/components/dashboard/onboarding/onboarding-dashboard-client";

type OrgRecord = {
    id: string;
    name: string;
    logoUrl?: string | null;
    logo?: string | null;
    subscriptionPlan?: string | null;
    businessType?: string | null;
};

type FallbackBusinessType = "laundry" | "fnb" | "retail";

function cloneNavItem(item: BusinessNavItem): BusinessNavItem {
    return {
        ...item,
        submenu: item.submenu?.map(cloneNavItem),
    };
}

function isNavItem(item: BusinessNavItem | undefined): item is BusinessNavItem {
    return Boolean(item);
}

const FALLBACK_NAV_REGISTRY: Record<FallbackBusinessType, Record<string, BusinessNavItem>> = {
    laundry: {
        dashboard: { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", path: "/dashboard" },
        cabang: { id: "cabang", label: "Cabang", icon: "building", path: "/cabang" },
        tim: {
            id: "tim",
            label: "Tim",
            icon: "users",
            path: "/tim",
            submenu: [
                { id: "members", label: "Anggota Tim", icon: "users", path: "/tim" },
                { id: "roles", label: "Role & Akses", icon: "shield", path: "/tim/roles" },
            ],
        },
        pengaturan: { id: "pengaturan", label: "Pengaturan", icon: "settings", path: "/pengaturan" },
        crm: {
            id: "crm",
            label: "Pelanggan Laundry",
            icon: "heart-handshake",
            path: "/laundry/customers",
            submenu: [
                { id: "customers", label: "Daftar Pelanggan Laundry", icon: "users", path: "/laundry/customers" },
                { id: "tags", label: "Tags", icon: "tags", path: "/crm/tags" },
            ],
        },
        order: {
            id: "order",
            label: "Order Cucian",
            icon: "basket",
            path: "/laundry/orders",
            submenu: [
                { id: "overview", label: "Ringkasan Laundry", icon: "layout-dashboard", path: "/laundry" },
                { id: "create", label: "Tambah Order", icon: "plus", path: "/laundry/orders/new" },
                { id: "list", label: "Daftar Order", icon: "list", path: "/laundry/orders" },
                { id: "services", label: "Layanan", icon: "box", path: "/laundry/services" },
            ],
        },
        inventory: { id: "inventory", label: "Inventory Laundry", icon: "box", path: "/inventory" },
        laporan: { id: "laporan", label: "Laporan Laundry", icon: "chart", path: "/laundry/reports" },
        pickup: { id: "pickup", label: "Pickup Laundry", icon: "truck", path: "/laundry/orders" },
    },
    fnb: {
        dashboard: { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", path: "/dashboard" },
        cabang: { id: "cabang", label: "Cabang", icon: "building", path: "/cabang" },
        tim: { id: "tim", label: "Tim", icon: "users", path: "/tim" },
        pengaturan: { id: "pengaturan", label: "Pengaturan", icon: "settings", path: "/pengaturan" },
        crm: {
            id: "crm",
            label: "Pelanggan F&B",
            icon: "heart-handshake",
            path: "/crm",
            submenu: [
                { id: "customers", label: "Daftar Pelanggan F&B", icon: "users", path: "/crm" },
                { id: "tags", label: "Tags", icon: "tags", path: "/crm/tags" },
            ],
        },
        order: { id: "order", label: "Order F&B", icon: "basket", path: "/order" },
        inventory: { id: "inventory", label: "Inventory F&B", icon: "box", path: "/inventory" },
        laporan: { id: "laporan", label: "Laporan F&B", icon: "chart", path: "/laporan" },
        meja: { id: "meja", label: "Manajemen Meja", icon: "grid", path: "/meja" },
        menu: { id: "menu", label: "Menu & Resep", icon: "book-open", path: "/menu" },
    },
    retail: {
        dashboard: { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", path: "/dashboard" },
        cabang: { id: "cabang", label: "Cabang", icon: "building", path: "/cabang" },
        tim: { id: "tim", label: "Tim", icon: "users", path: "/tim" },
        pengaturan: { id: "pengaturan", label: "Pengaturan", icon: "settings", path: "/pengaturan" },
        crm: {
            id: "crm",
            label: "Pelanggan Retail",
            icon: "heart-handshake",
            path: "/crm",
            submenu: [
                { id: "customers", label: "Daftar Pelanggan Retail", icon: "users", path: "/crm" },
                { id: "tags", label: "Tags", icon: "tags", path: "/crm/tags" },
            ],
        },
        order: { id: "order", label: "Order Retail", icon: "basket", path: "/order" },
        inventory: { id: "inventory", label: "Inventory Retail", icon: "box", path: "/inventory" },
        laporan: { id: "laporan", label: "Laporan Retail", icon: "chart", path: "/laporan" },
        products: { id: "products", label: "Katalog Produk", icon: "box", path: "/products" },
        suppliers: { id: "suppliers", label: "Pemasok", icon: "users", path: "/suppliers" },
    },
};

const FALLBACK_BASE_MODULES = ["dashboard", "cabang", "tim", "pengaturan"] as const;
const FALLBACK_VERTICAL_BY_TYPE: Record<FallbackBusinessType, string[]> = {
    laundry: ["crm", "order", "inventory", "laporan", "pickup"],
    fnb: ["crm", "order", "inventory", "laporan", "meja", "menu"],
    retail: ["crm", "order", "inventory", "laporan", "products", "suppliers"],
};

function normalizeFallbackBusinessType(value: string | null | undefined): FallbackBusinessType {
    const normalized = value?.toLowerCase().trim();
    if (!normalized) return "retail";
    if (normalized === "laundry" || normalized === "fnb" || normalized === "retail") {
        return normalized;
    }
    if (normalized === "caffe" || normalized === "food") return "fnb";
    return "retail";
}

function buildFallbackNavigation(
    businessType: string | null | undefined
): { navigationBase: BusinessNavItem[]; navigationVertical: BusinessNavItem[]; navigation: BusinessNavItem[] } {
    const type = normalizeFallbackBusinessType(businessType);
    const registry = FALLBACK_NAV_REGISTRY[type];

    const navigationBase = FALLBACK_BASE_MODULES
        .map((key) => registry[key])
        .filter(isNavItem)
        .map((item) => cloneNavItem(item));

    const navigationVertical = (FALLBACK_VERTICAL_BY_TYPE[type] ?? [])
        .map((key) => registry[key])
        .filter(isNavItem)
        .map((item) => cloneNavItem(item));

    return {
        navigationBase,
        navigationVertical,
        navigation: [...navigationBase, ...navigationVertical],
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

function detectHtmlInterception(
    contentType: string | null,
    rawText: string
): string | null {
    const sample = `${contentType ?? ""}\n${rawText.slice(0, 600)}`.toLowerCase();
    const looksLikeHtml = sample.includes("text/html") || sample.includes("<!doctype html");
    if (!looksLikeHtml) return null;

    if (sample.includes("malwarebytes")) {
        return "Likely intercepted by Malwarebytes Web Protection";
    }

    return "Expected JSON API response but received HTML";
}

const NAVIGATION_FETCH_TIMEOUT_MS = 1200;

async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs: number
): Promise<{ response: Response | null; timedOut: boolean; error: Error | null }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        return { response, timedOut: false, error: null };
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return { response: null, timedOut: true, error: null };
        }
        return {
            response: null,
            timedOut: false,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    } finally {
        clearTimeout(timer);
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
    const routingPromise = resolveDashboardRoutingTarget();

    const cookie = reqHeaders.get("cookie") || "";
    const apiBaseUrl = getSafeApiBaseUrl();
    let navItems: BusinessNavItem[] = [];
    let navBaseItems: BusinessNavItem[] = [];
    let navVerticalItems: BusinessNavItem[] = [];
    let navLoaded = false;
    let businessName: string | null = activeOrganization?.name ?? null;
    let businessType: string | null = activeOrganization?.businessType ?? null;
    let roleName: string | null = null;
    let permissions: string[] = [];
    const fallbackNav = buildFallbackNavigation(businessType);
    navItems = fallbackNav.navigation;
    navBaseItems = fallbackNav.navigationBase;
    navVerticalItems = fallbackNav.navigationVertical;
    const navigationPromise = activeOrganization?.id
        ? fetchWithTimeout(
            `${apiBaseUrl}/api/businesses/${activeOrganization.id}/navigation`,
            {
                headers: {
                    cookie,
                    accept: "application/json",
                },
                cache: "no-store",
                redirect: "manual",
            },
            NAVIGATION_FETCH_TIMEOUT_MS
        )
        : null;

    const routing = await routingPromise;
    if (!routing) {
        redirect("/login");
    }

    if (navigationPromise) {
        try {
            const navigationResult = await navigationPromise;
            const navRes = navigationResult.response;
            if (!navRes) {
                if (navigationResult.timedOut) {
                    console.warn(
                        "Failed to fetch business navigation (timeout):",
                        `timeoutMs=${NAVIGATION_FETCH_TIMEOUT_MS}`,
                        `orgId=${activeOrganization?.id ?? "unknown"}`,
                        "using fallback navigation"
                    );
                } else if (navigationResult.error) {
                    console.error("Failed to fetch business navigation (request error):", navigationResult.error);
                }
            } else {
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
                    const redirectLocation = navRes.headers.get("location");
                    const preview = rawText.slice(0, 280);
                    const interceptionHint = detectHtmlInterception(contentType, rawText);
                    console.error(
                        "Failed to fetch business navigation:",
                        `url=${navRes.url}`,
                        `status=${navRes.status}`,
                        redirectLocation ? `location=${redirectLocation}` : "",
                        `contentType=${contentType}`,
                        interceptionHint ? `hint=${interceptionHint}` : "",
                        preview
                    );
                }
            }
        } catch (error) {
            console.error("Failed to fetch business navigation (request error):", error);
        }
        navLoaded = true;
    }

    let hasBranch = routing.accessibleBranches.length > 0;
    let modeSelected = true;
    if (!hasBranch && activeOrganization?.id) {
        const [orgMetaResult, branchCountResult] = await Promise.allSettled([
            db
                .select({ metadata: organization.metadata })
                .from(organization)
                .where(eq(organization.id, activeOrganization.id))
                .limit(1),
            db
                .select({ count: sql<number>`count(*)` })
                .from(branches)
                .where(eq(branches.organizationId, activeOrganization.id)),
        ]);

        if (orgMetaResult.status === "fulfilled") {
            const [orgMeta] = orgMetaResult.value;
            const metadata = parseMetadata(orgMeta?.metadata ?? null);
            const onboardingMeta = (metadata.onboarding && typeof metadata.onboarding === "object")
                ? (metadata.onboarding as Record<string, unknown>)
                : {};
            modeSelected = onboardingMeta.modeSelected === true;
        } else {
            // Fail open here so dashboard does not hard-crash due a metadata schema mismatch.
            console.error(
                "Failed to read organization onboarding metadata:",
                `orgId=${activeOrganization.id}`,
                orgMetaResult.reason
            );
        }

        if (branchCountResult.status === "fulfilled") {
            hasBranch = Number(branchCountResult.value[0]?.count ?? 0) > 0;
        } else {
            console.error(
                "Failed to count organization branches:",
                `orgId=${activeOrganization.id}`,
                branchCountResult.reason
            );
        }
    }

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
    let onboarding: DashboardOnboardingState | null = null;

    if (activeOrganization?.id) {
        const [orgOnboardingRows, productCountRows, inviteCountRows, transactionCountRows] = await Promise.all([
            db
                .select({ metadata: organization.metadata })
                .from(organization)
                .where(eq(organization.id, activeOrganization.id))
                .limit(1),
            db
                .select({ count: sql<number>`count(*)` })
                .from(products)
                .where(eq(products.organizationId, activeOrganization.id)),
            db
                .select({ count: sql<number>`count(*)` })
                .from(invitation)
                .where(eq(invitation.organizationId, activeOrganization.id)),
            db
                .select({ count: sql<number>`count(*)` })
                .from(transactions)
                .where(eq(transactions.organizationId, activeOrganization.id)),
        ]);
        const metadata = parseMetadata(orgOnboardingRows[0]?.metadata ?? null);
        const onboardingMeta = metadata.onboarding && typeof metadata.onboarding === "object"
            ? (metadata.onboarding as Record<string, unknown>)
            : {};

        if (onboardingMeta.onboardingCompleted === true) {
            onboarding = {
                showWelcomeBanner: onboardingMeta.welcomeBannerDismissed !== true,
                hasProducts: Number(productCountRows[0]?.count ?? 0) > 0,
                hasInvites: Number(inviteCountRows[0]?.count ?? 0) > 0,
                hasTransactions: Number(transactionCountRows[0]?.count ?? 0) > 0,
                paths: {
                    pos: "/order",
                    products: "/products",
                    team: "/tim",
                },
            };
        }
    }

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
            onboarding={onboarding}
        >
            {children}
        </DashboardShell>
    );
}
