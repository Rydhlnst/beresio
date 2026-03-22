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

    return (
        <SectionCard 
            title="Pesanan Terbaru" 
            description="5 transaksi terakhir dari semua cabang"
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
                <div className="divide-y divide-border/40 -mx-4 -mb-4">
                    {orders.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate uppercase">
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
                                    <Badge variant={getStatusColor(order.status) as any} className="text-[10px] px-1.5 py-0 h-4 uppercase">
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
