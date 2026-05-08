import { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata: Metadata = {
    title: "Legacy Dashboard Highlights",
    description: "Redirect legacy route ke dashboard canonical.",
};

export default async function DashboardHighlightsPage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }
    redirect(routing.targetPath);
}
