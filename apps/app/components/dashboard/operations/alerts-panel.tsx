import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { SectionCard } from "../shared/section-card";
import { CardEmptyState } from "../shared/card-empty-state";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export async function AlertsPanel() {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get('cookie') || '';
    
    const res = await (apiClient.api.dashboard.alerts as any).$get({}, {
        headers: { cookie }
    });
    
    if (!res.ok) return null;
    
    const alerts = (await res.json() as any)?.data || [];

    return (
        <SectionCard 
            title="Perlu Perhatian" 
            description="Tugas tertunda dan notifikasi kritis"
            className="h-auto min-h-[168px]"
        >
            {alerts.length === 0 ? (
                <CardEmptyState 
                    icon={AlertCircle} 
                    title="Semua aman" 
                    description="Tidak ada peringatan saat ini."
                    className="py-12"
                />
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert: any) => (
                        <Link 
                            key={alert.id} 
                            href={alert.actionUrl || "#"}
                            className={cn(
                                "flex items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm",
                                alert.type === 'danger' ? "border-[#f0d1d1] bg-[#fff4f4] hover:border-[#e8b8b8]" : "border-[#ead7b7] bg-[#fff8e8] hover:border-[#e2c990]"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                alert.type === 'danger' ? "bg-[#fde1e1] text-[#b42318]" : "bg-[#fee8c8] text-[#b45309]"
                            )}>
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className={cn(
                                    "text-xs font-bold uppercase tracking-tight",
                                    alert.type === 'danger' ? "text-[#b42318]" : "text-[#b45309]"
                                )}>
                                    {alert.title}
                                </h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                    {alert.description}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 self-center" />
                        </Link>
                    ))}
                </div>
            )}
        </SectionCard>
    );
}
