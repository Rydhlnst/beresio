import Link from "next/link";
import { SectionCard } from "../shared/section-card";
import { CardEmptyState } from "../shared/card-empty-state";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";
import { RoleChip } from "./role-chip";
import { Users, AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export async function RBACOverviewCard() {
    const res = await apiClient.api.dashboard.rbac.summary.$get(undefined, {
        headers: { cookie: (await headers()).get("cookie") || "" }
    });

    if (!res.ok) {
        console.error("Failed to fetch RBAC summary:", await res.text());
        return (
            <SectionCard title="Akses & Tim">
                <ErrorToast
                    id="dashboard-rbac-error"
                    title="Gagal memuat data tim"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat data tim"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    const body = await res.json();
    const data = (body as any).data || {};
    
    const rbacRoles = data.roleDistribution || [];
    const isEmpty = rbacRoles.length === 0;

    const rbacAlerts = [];
    if (data.pendingInvites > 0) {
        rbacAlerts.push({
            type: "pending",
            message: `${data.pendingInvites} undangan belum diterima`
        });
    }

    const rbacRecentActivity = (data.recentActivity || []).map((item: any) => ({
        description: item.description || "Melakukan aktivitas",
        timeAgo: formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: id })
    }));

    return (
        <SectionCard
            title="Akses & Tim"
            className="h-full"
            actions={
                <Link
                    href="/settings/access"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:opacity-80 transition-opacity duration-150 ease-out"
                >
                    Kelola <ExternalLink className="h-3 w-3" />
                </Link>
            }
        >
            {isEmpty ? (
                <CardEmptyState
                    icon={Users}
                    title="Belum ada anggota tim"
                    description="Undang yang pertama →"
                />
            ) : (
                <div className="space-y-4">
                    {/* Role Chips */}
                    <div className="flex flex-wrap gap-2">
                        {rbacRoles.map((r: any) => (
                            <RoleChip key={r.role} role={r.role} count={r.count} />
                        ))}
                    </div>

                    {/* Alerts */}
                    {rbacAlerts.length > 0 && (
                        <div className="space-y-2 border-t border-border/40 pt-4">
                            {rbacAlerts.map((alert, i) => (
                                <div key={i} className={cn(
                                    "flex items-center gap-2 text-xs font-semibold rounded-lg px-4 py-2 border border-border/60 bg-muted/40 text-foreground"
                                )}>
                                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                    {alert.message}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="border-t border-border/40 pt-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Aktivitas terbaru
                        </p>
                        <ul className="space-y-2">
                            {rbacRecentActivity.map((item: any, i: number) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
                                    <span className="font-normal">{item.description}</span>
                                    <span className="ml-auto text-muted-foreground/70">{item.timeAgo}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </SectionCard>
    );
}
