import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";
import { DashboardLayoutSwitcher } from "@/components/dashboard/unified/dashboard-layout-switcher";

type OrgDashboardPageProps = {
    params: Promise<{ orgSlug: string }>;
};

export const metadata: Metadata = {
    title: "Organization Dashboard",
    description: "Ringkasan lintas cabang untuk owner dan admin.",
};

export default async function OrgDashboardPage({ params }: OrgDashboardPageProps) {
    const { orgSlug } = await params;
    const routing = await resolveDashboardRoutingTarget({ orgSlug });
    if (!routing) {
        redirect("/login");
    }

    if (routing.mode !== "multi" || !routing.isOrgLevelRole) {
        redirect(routing.targetPath);
    }

    if (routing.orgSlug !== orgSlug) {
        redirect(`/dashboard/${routing.orgSlug}`);
    }

    return (
        <DashboardLayoutSwitcher
            orgContext={{
                orgSlug: routing.orgSlug,
                mode: routing.mode,
                isOrgLevelRole: routing.isOrgLevelRole,
            }}
        />
    );
}
