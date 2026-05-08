import { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata: Metadata = {
    title: "Legacy Dashboard Highlight Create",
    description: "Redirect legacy route ke dashboard canonical.",
};

export default async function DashboardHighlightNewPage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }
    redirect(routing.targetPath);
}
