import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { OrderPageClient } from "./_components/order-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";

export const metadata: Metadata = {
    title: "Order | Beres",
    description: "Pantau semua order lintas cabang secara real-time",
};

type OrderSummary = {
    id: string;
    orderNumber: string;
    status: string;
    type: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string | null;
    createdAt: string;
    branch: { id: string; name: string } | null;
    customer: { id: string; name: string } | null;
};

type OrderDetail = {
    id: string;
    orderNumber: string;
    status: string;
    type: string;
    subtotalAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    branch: { id: string; name: string } | null;
    customer: { id: string; name: string } | null;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    events: Array<{
        id: string;
        status: string;
        note: string | null;
        actorId: string | null;
        createdAt: string;
    }>;
};

type BranchOption = { id: string; name: string };
type CustomerOption = { id: string; name: string; phone?: string | null; email?: string | null; address?: string | null };

type SearchParams = {
    orderId?: string;
    status?: string;
    branchId?: string;
    type?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
};

export default async function OrderPage({ searchParams }: { searchParams: SearchParams }) {
    const cookie = (await headers()).get("cookie") || "";

    const [ordersRes, branchesRes, customersRes] = await Promise.all([
        apiClient.api.dashboard.orders.$get(
            {
                query: {
                    status: searchParams.status,
                    branchId: searchParams.branchId,
                    type: searchParams.type,
                    q: searchParams.q,
                    dateFrom: searchParams.dateFrom,
                    dateTo: searchParams.dateTo,
                },
            },
            { headers: { cookie } }
        ),
        apiClient.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.customers.$get(undefined, { headers: { cookie } }),
    ]);

    if (!ordersRes.ok || !branchesRes.ok || !customersRes.ok) {
        if (!ordersRes.ok) console.error("Failed to fetch orders:", await ordersRes.text());
        if (!branchesRes.ok) console.error("Failed to fetch branches:", await branchesRes.text());
        if (!customersRes.ok) console.error("Failed to fetch customers:", await customersRes.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Order</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Pantau semua order lintas cabang secara real-time.
                    </p>
                </div>
                <ErrorToast
                    id="page-orders-error"
                    title="Gagal memuat data order"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat data order"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const ordersBody = await ordersRes.json();
    const branchesBody = await branchesRes.json();
    const customersBody = await customersRes.json();
    const orders = ((ordersBody as { data?: OrderSummary[] }).data ?? []);
    const branches = ((branchesBody as { data?: BranchOption[] }).data ?? []);
    const customers = ((customersBody as { data?: CustomerOption[] }).data ?? []);

    const selectedOrderId = searchParams.orderId ?? orders[0]?.id ?? null;

    let selectedOrder: OrderDetail | null = null;
    if (selectedOrderId) {
        const detailRes = await apiClient.api.dashboard.orders[":id"].$get(
            { param: { id: selectedOrderId } },
            { headers: { cookie } }
        );
        if (detailRes.ok) {
            const detailBody = await detailRes.json();
            selectedOrder = (detailBody as { data?: OrderDetail }).data ?? null;
        } else {
            console.error("Failed to fetch order detail:", await detailRes.text());
        }
    }

    return (
        <OrderPageClient
            orders={orders}
            branches={branches}
            customers={customers}
            selectedOrderId={selectedOrderId}
            selectedOrder={selectedOrder}
            filters={{
                status: searchParams.status ?? "",
                branchId: searchParams.branchId ?? "",
                type: searchParams.type ?? "",
                q: searchParams.q ?? "",
                dateFrom: searchParams.dateFrom ?? "",
                dateTo: searchParams.dateTo ?? "",
            }}
        />
    );
}
