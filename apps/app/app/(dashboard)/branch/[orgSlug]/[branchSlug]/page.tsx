import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { branches, createDbNextjs } from "@beresio/db";

import { resolveDashboardRoutingTarget, buildBranchDashboardPath } from "@/lib/dashboard-routing.server";
import { DashboardLayoutSwitcher } from "@/components/dashboard/unified/dashboard-layout-switcher";

type BranchDashboardPageProps = {
    params: Promise<{ orgSlug: string; branchSlug: string }>;
};

export const metadata = {
    title: "Branch Dashboard",
    description: "Ringkasan KPI, chart, dan aktivitas untuk satu cabang.",
};

export default async function BranchDashboardPage({ params }: BranchDashboardPageProps) {
    const { orgSlug, branchSlug } = await params;
    const routing = await resolveDashboardRoutingTarget({
        orgSlug,
        branchSlug,
        forceBranchPath: true,
    });

    if (!routing) {
        redirect("/login");
    }

    const db = createDbNextjs(process.env.DATABASE_URL!);
    const branch = routing.accessibleBranches.find((item) => item.slug === branchSlug);

    if (!branch) {
        redirect(routing.targetPath);
    }

    const [branchRow] = await db
        .select({
            id: branches.id,
            name: branches.name,
            code: branches.code,
        })
        .from(branches)
        .where(and(eq(branches.id, branch.id), eq(branches.organizationId, routing.orgId)))
        .limit(1);

    if (!branchRow) {
        redirect(routing.targetPath);
    }

    const canonicalPath = buildBranchDashboardPath(routing.orgSlug, branchRow.code);
    if (canonicalPath !== `/branch/${orgSlug}/${branchSlug}`) {
        redirect(canonicalPath);
    }

    return (
        <DashboardLayoutSwitcher
            orgContext={{
                orgSlug: routing.orgSlug,
                mode: routing.mode,
                isOrgLevelRole: routing.isOrgLevelRole,
            }}
            branchContext={{
                branchId: branchRow.id,
                branchCode: branchRow.code,
                branchName: branchRow.name,
                roleSlug: routing.roleSlug,
                mode: routing.mode,
            }}
        />
    );
}
