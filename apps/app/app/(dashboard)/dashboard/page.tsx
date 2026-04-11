import { redirect } from "next/navigation";
import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export default async function DashboardLegacyEntryPage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }

    redirect(routing.targetPath);
}
