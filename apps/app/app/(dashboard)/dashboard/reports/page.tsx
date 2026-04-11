import { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata: Metadata = {
    title: "Legacy Dashboard Reports",
    description: "Redirect legacy route ke dashboard canonical.",
};

export default async function DashboardReportsPage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }
    redirect(routing.targetPath);
}
