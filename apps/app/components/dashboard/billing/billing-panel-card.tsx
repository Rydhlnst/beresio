import { SectionCard } from "../shared/section-card";
import { UsageBar } from "./usage-bar";
import { Download, CheckCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";

export async function BillingPanelCard() {
    const res = await apiClient.api.dashboard.billing.status.$get(undefined, {
        headers: { cookie: (await headers()).get("cookie") || "" }
    });
    
    if (!res.ok) {
        console.error("Failed to fetch billing status:", await res.text());
        return (
            <SectionCard title="Langganan">
                <ErrorToast
                    id="dashboard-billing-error"
                    title="Gagal memuat data langganan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat data langganan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    const body: any = await res.json();
    const data = body.data || {
        plan: "starter",
        usage: { branches: { current: 0, limit: 1 }, members: { current: 0, limit: 3 } },
        recentPayments: []
    };

    const usage = {
        branches: { used: data.usage.branches.current, max: data.usage.branches.limit || 1 },
        users: { used: data.usage.members.current, max: data.usage.members.limit || 3 },
    };

    const branchPct = (usage.branches.used / usage.branches.max) * 100;
    const userPct = (usage.users.used / usage.users.max) * 100;
    const showUpgradeNudge = branchPct >= 80 || userPct >= 80;
    
    const planName = data.plan.charAt(0).toUpperCase() + data.plan.slice(1) + " Plan";

    return (
        <SectionCard title="Langganan">
            <div className="flex h-full flex-col gap-4">
                {/* Upgrade nudge banner */}
                {showUpgradeNudge && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-4">
                        <p className="text-xs font-semibold text-foreground">
                            Hampir penuh! Cabang kamu {usage.branches.used}/{usage.branches.max}.{" "}
                            <a href="/settings/billing" className="underline font-semibold text-primary">
                                Upgrade untuk tumbuh lebih jauh.
                            </a>
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Plan info */}
                    <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">{planName}</p>
                            <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-1 border border-primary/20">
                                <CheckCircle className="h-3 w-3" /> Aktif
                            </span>
                        </div>
                    </div>

                    {/* Usage bars */}
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penggunaan</p>
                        <UsageBar label="Cabang" used={usage.branches.used} max={usage.branches.max} />
                        <UsageBar label="Users" used={usage.users.used} max={usage.users.max} />
                    </div>

                    {/* Invoices */}
                    {data.recentPayments && data.recentPayments.length > 0 && (
                        <div className="space-y-2 border-t border-border/40 pt-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice terakhir</p>
                            {data.recentPayments.map((inv: any) => (
                                <div key={inv.id} className="flex items-center justify-between rounded-lg hover:bg-muted/40 px-2 py-2 -mx-2 transition-colors duration-150 ease-out">
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">
                                            {format(new Date(inv.createdAt), "MMM yyyy", { locale: id })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Rp {inv.amount.toLocaleString("id-ID")}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                        className="h-7 text-xs font-semibold gap-2"
                                    >
                                        <Download className="h-3 w-3" />
                                        Unduh
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button
                    variant="outline"
                    className="w-full text-xs font-semibold h-9 transition-colors duration-150 ease-out"
                    asChild
                >
                    <a href="/settings/billing">Lihat Semua Invoice</a>
                </Button>
            </div>
        </SectionCard>
    );
}
