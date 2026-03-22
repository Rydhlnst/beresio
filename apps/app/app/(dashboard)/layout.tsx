import { auth } from "@/lib/auth";
import { createDbNextjs, team } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { BusinessNavResponse, BusinessNavItem } from "@/components/dashboard/layout/nav-config";
import { DashboardShell } from "@/components/dashboard/layout/dashboard-shell";
import { eq, sql } from "drizzle-orm";

type OrgRecord = {
    id: string;
    name: string;
    logoUrl?: string | null;
    logo?: string | null;
    subscriptionPlan?: string | null;
    businessType?: string | null;
};

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

    const cookie = reqHeaders.get("cookie") || "";
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
    let navItems: BusinessNavItem[] = [];
    let navBaseItems: BusinessNavItem[] = [];
    let navVerticalItems: BusinessNavItem[] = [];
    let navLoaded = false;
    let businessName: string | null = activeOrganization?.name ?? null;
    let businessType: string | null = activeOrganization?.businessType ?? null;

    if (activeOrganization?.id) {
        const navRes = await fetch(
            `${apiBaseUrl}/api/businesses/${activeOrganization.id}/navigation`,
            {
                headers: { cookie },
                cache: "no-store",
            }
        );

        if (navRes.ok) {
            const navBody = (await navRes.json()) as { data?: BusinessNavResponse };
            const navData = navBody?.data;
            navItems = navData?.navigation ?? [];
            navBaseItems = navData?.navigationBase ?? [];
            navVerticalItems = navData?.navigationVertical ?? [];
            businessName = navData?.business?.name ?? businessName;
            businessType = navData?.business?.type ?? businessType;
        } else {
            console.error("Failed to fetch business navigation:", await navRes.text());
        }
        navLoaded = true;
    }

    const teamCountRows = activeOrganization?.id
        ? await db
            .select({ count: sql<number>`count(*)` })
            .from(team)
            .where(eq(team.organizationId, activeOrganization.id))
        : [{ count: 0 }];

    const hasTeam = Number(teamCountRows[0]?.count ?? 0) > 0;

    if (!hasTeam) {
        redirect("/onboarding/team");
    }

    const activePlan = activeOrganization?.plan ?? "starter";

    return (
        <DashboardShell
            organizationName={businessName ?? "Organisasi"}
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
