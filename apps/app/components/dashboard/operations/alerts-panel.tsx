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
                                "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                                alert.type === 'danger' ? "bg-red-50/50 border-red-100 hover:border-red-200" : "bg-orange-50/50 border-orange-100 hover:border-orange-200"
                            )}
                        >
                            <div className={cn(
                                "mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                alert.type === 'danger' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            )}>
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className={cn(
                                    "text-xs font-bold uppercase tracking-tight",
                                    alert.type === 'danger' ? "text-red-700" : "text-orange-700"
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
