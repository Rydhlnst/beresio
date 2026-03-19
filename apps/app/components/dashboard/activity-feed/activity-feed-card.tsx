import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { ActivityFeedClient } from "./activity-feed-client";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { SectionCard } from "../shared/section-card";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";

export async function ActivityFeedCard() {
    const res = await apiClient.api.dashboard.activities.$get({ query: { limit: "20" } }, {
        headers: { cookie: (await headers()).get("cookie") || "" }
    });

    if (!res.ok) {
        console.error("Failed to fetch activities:", await res.text());
        return (
            <SectionCard title="Aktivitas Real-time" className="h-full">
                <ErrorToast
                    id="dashboard-activity-error"
                    title="Gagal memuat aktivitas"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat aktivitas"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    const body: any = await res.json();
    const rawData = body.data || [];

    const data = rawData.map((item: any) => {
        let uiType = "system";
        if (item.type === "PAYMENT" || item.type === "ORDER") uiType = "order";
        else if (item.type === "RBAC" || item.type === "AUTH") uiType = "staff";
        
        if (item.level === "warning" || item.level === "error" || item.level === "critical") uiType = "alert";

        return {
            id: item.id,
            description: item.description || "Aktivitas baru",
            branch: item.actorName || "Sistem",
            timeAgo: formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: id }),
            type: uiType
        };
    });

    return <ActivityFeedClient data={data} />;
}
