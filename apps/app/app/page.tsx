import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Akses dashboard utama Beres.",
};

export default async function HomePage() {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }

    redirect(routing.targetPath);
}
