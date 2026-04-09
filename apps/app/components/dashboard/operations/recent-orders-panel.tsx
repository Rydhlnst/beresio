import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { SectionCard } from "../shared/section-card";
import { CardEmptyState } from "../shared/card-empty-state";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Badge } from "@repo/ui";
import Link from "next/link";

export async function RecentOrdersPanel() {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get('cookie') || '';
    
    const res = await (apiClient.api.dashboard.orders as any).$get({
        query: { limit: "5" }
    }, {
        headers: { cookie }
    });
    
    if (!res.ok) return null;
    
    const body = await res.json() as any;
    const orders = body?.data ?? [];
    
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            case 'cancelled': return 'error';
            default: return 'secondary';
        }
    };

    const getStatusClass = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "border-[#cddfce] bg-[#ecf6ee] text-[#2f7b45]";
            case "processing":
                return "border-[#ead7b7] bg-[#fff8e8] text-[#b45309]";
            case "cancelled":
                return "border-[#f0d1d1] bg-[#fff1f1] text-[#b42318]";
            default:
                return "border-border/70 bg-secondary text-muted-foreground";
        }
    };

    return (
        <SectionCard 
            title="Pesanan Terbaru" 
            description="5 transaksi terakhir dari semua cabang"
            className="h-auto min-h-[360px]"
            actions={
                <Link 
                    href="/dashboard/orders" 
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                    Lihat Semua <ArrowRight className="w-3 h-3" />
                </Link>
            }
        >
            {orders.length === 0 ? (
                <CardEmptyState 
                    icon={ShoppingBag} 
                    title="Belum ada pesanan" 
                    description="Transaksi akan muncul di sini."
                />
            ) : (
                <div className="-mx-5 -mb-5 rounded-b-2xl border-t border-border/60 bg-background">
                    {orders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between border-b border-border/50 px-5 py-3 transition-colors last:border-b-0 hover:bg-secondary/40">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {order.orderNumber}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {order.customer?.name || "Pelanggan Umum"} • {order.branch?.name}
                                </p>
                            </div>
                            <div className="text-right ml-4">
                                <p className="text-sm font-bold text-foreground">
                                    {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                        minimumFractionDigits: 0,
                                    }).format(order.totalAmount)}
                                </p>
                                <div className="mt-1 flex justify-end">
                                    <Badge
                                        variant={getStatusColor(order.status) as any}
                                        className={`h-5 rounded-full border px-2 py-0 text-[10px] font-semibold uppercase ${getStatusClass(order.status)}`}
                                    >
                                        {order.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    );
}
