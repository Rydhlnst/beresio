import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { BranchCreateWizardClient } from "./_components/branch-create-wizard-client";
import { buildOrgDashboardPath, resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata: Metadata = {
    title: "Tambah Cabang",
    description: "Buat cabang baru untuk organisasi.",
};

export default async function CabangNewPage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }
    if (routing.mode !== "multi" || !routing.isOrgLevelRole) {
        redirect(routing.targetPath);
    }

    const cookie = (await headers()).get("cookie") || "";
    const membersRes = await (apiClient as any).api.dashboard.team.members.$get(undefined, {
        headers: { cookie },
    });

    let members: any[] = [];
    if (membersRes.ok) {
        const body = await membersRes.json().catch(() => null);
        const raw = (body as any)?.data ?? [];
        members = Array.isArray(raw) ? raw : raw?.data ?? [];
    } else {
        console.error("Failed to fetch team members:", await membersRes.text());
    }

    return <BranchCreateWizardClient members={members} orgOverviewPath={buildOrgDashboardPath(routing.orgSlug)} />;
}
