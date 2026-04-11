import { redirect } from "next/navigation";
import { buildOrgDashboardPath, resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata = {
    title: "Branches",
    description: "Legacy route redirect ke dashboard canonical.",
};

export default async function BranchesLegacyPage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }

    if (routing.mode === "multi" && routing.isOrgLevelRole) {
        redirect(buildOrgDashboardPath(routing.orgSlug));
    }

    redirect(routing.targetPath);
}
