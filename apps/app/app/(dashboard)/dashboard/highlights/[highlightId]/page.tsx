import { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

type HighlightPageProps = {
    params: Promise<{ highlightId: string }>;
};

export async function generateMetadata({ params }: HighlightPageProps): Promise<Metadata> {
    const { highlightId } = await params;

    return {
        title: `Legacy Dashboard Highlight ${highlightId}`,
        description: "Redirect legacy route ke dashboard canonical.",
    };
}

export default async function DashboardHighlightDetailPage(_props: HighlightPageProps) {
    const routing = await resolveDashboardRoutingTarget();
    if (!routing) {
        redirect("/login");
    }
    redirect(routing.targetPath);
}
