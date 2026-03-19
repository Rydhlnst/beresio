import { auth } from "@/lib/auth";
import { createDbNextjs, member, roles, team } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NAV_ITEMS } from "@/components/dashboard/layout/nav-config";
import { DashboardShell } from "@/components/dashboard/layout/dashboard-shell";
import { and, eq, sql } from "drizzle-orm";

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

    if (organizations.length === 0) {
        redirect("/onboarding/org");
    }

    const activeOrganizationId =
        (session as any)?.activeOrganizationId ?? organizations[0]?.id;
    const activeOrganization =
        organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0];

    const memberRows = activeOrganization?.id
        ? await db
            .select({ roleSlug: roles.slug, roleLegacy: member.role })
            .from(member)
            .leftJoin(roles, eq(member.roleId, roles.id))
            .where(
                and(
                    eq(member.organizationId, activeOrganization.id),
                    eq(member.userId, session.user.id)
                )
            )
            .limit(1)
        : [];

    const userRole = (memberRows[0]?.roleSlug ?? memberRows[0]?.roleLegacy ?? "owner").toLowerCase();
    const orgVertical = (activeOrganization?.businessType ?? "laundry").toLowerCase();

    const visibleNavItems = NAV_ITEMS.filter((item) => {
        const roleMatch = item.roles.includes(userRole);
        const verticalMatch = !item.verticals || item.verticals.includes(orgVertical);
        return roleMatch && verticalMatch;
    });

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
            organizationName={activeOrganization?.name ?? "Organisasi"}
            user={{
                name: session.user.name ?? "Owner",
                email: session.user.email ?? "",
                avatar: session.user.image ?? "",
            }}
            plan={activePlan}
            organizations={organizations}
            activeOrganizationId={activeOrganization?.id}
            navItems={visibleNavItems}
        >
            {children}
        </DashboardShell>
    );
}
