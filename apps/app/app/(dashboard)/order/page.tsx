import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { OrderPageClient } from "./_components/order-page-client";
import { RetailPosPageClient } from "./_components/retail-pos-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Order",
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
type CustomerOption = { id: string; name: string; phone: string | null; email: string | null; address: string | null };
type IncomingOrderIntake = {
    id: string;
    referenceCode: string;
    status: string;
    orderType: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    pickupPreferenceAt: string | null;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    riskFlags: string[];
    branchName: string | null;
    notes: string | null;
    createdAt: string;
    convertedOrderId: string | null;
    verifiedAt: string | null;
};
type RecentTransaction = {
    id: string;
    amount: number;
    discountAmount: number;
    taxAmount: number;
    paymentMethod: string | null;
    createdAt: string;
    customer: { id: string; name: string } | null;
};

type SearchParams = {
    orderId?: string;
    status?: string;
    branchId?: string;
    type?: string;
    orderType?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
};

async function renderLaundryOrderPage(searchParams: SearchParams) {
    const cookie = (await headers()).get("cookie") || "";
    const rpc = apiClient as any;

    const [ordersRes, branchesRes, customersRes, incomingIntakesRes] = await Promise.all([
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
        rpc.api.dashboard.laundry["order-intakes"].$get(
            {
                query: {
                    branchId: searchParams.branchId,
                    status: "pending_verification",
                    limit: "30",
                },
            },
            { headers: { cookie } }
        ),
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
    const incomingIntakesBody = incomingIntakesRes.ok
        ? await incomingIntakesRes.json().catch(() => ({}))
        : {};
    const orders = ((ordersBody as { data?: OrderSummary[] }).data ?? []);
    const branches = ((branchesBody as { data?: BranchOption[] }).data ?? []);
    const customers = ((customersBody as { data?: CustomerOption[] }).data ?? []);
    const incomingIntakes = ((incomingIntakesBody as { data?: IncomingOrderIntake[] }).data ?? []);

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
            incomingIntakes={incomingIntakes}
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

async function renderRetailPosPage() {
    const cookie = (await headers()).get("cookie") || "";

    const [productsRes, branchesRes, customersRes, transactionsRes] = await Promise.all([
        apiClient.api.dashboard.products.$get(
            { query: { page: "1", limit: "100" } },
            { headers: { cookie } }
        ),
        apiClient.api.dashboard.branches.mine.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.customers.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.transactions.$get(
            { query: { limit: "5" } },
            { headers: { cookie } }
        ),
    ]);

    if (!productsRes.ok || !branchesRes.ok || !customersRes.ok || !transactionsRes.ok) {
        if (!productsRes.ok) console.error("Failed to fetch products:", await productsRes.text());
        if (!branchesRes.ok) console.error("Failed to fetch branches:", await branchesRes.text());
        if (!customersRes.ok) console.error("Failed to fetch customers:", await customersRes.text());
        if (!transactionsRes.ok) console.error("Failed to fetch transactions:", await transactionsRes.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">POS / Kasir</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Buat transaksi retail dengan cepat.
                    </p>
                </div>
                <ErrorToast
                    id="page-retail-pos-error"
                    title="Gagal memuat POS"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat POS"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const productsBody = await productsRes.json();
    const branchesBody = await branchesRes.json();
    const customersBody = await customersRes.json();
    const transactionsBody = await transactionsRes.json();

    const products = (productsBody as { data?: { data?: any[] } }).data?.data ?? [];
    const branches = (branchesBody as { data?: BranchOption[] }).data ?? [];
    const customers = (customersBody as { data?: CustomerOption[] }).data ?? [];
    const recentTransactions = (transactionsBody as { data?: RecentTransaction[] }).data ?? [];

    return (
        <RetailPosPageClient
            products={products}
            branches={branches}
            customers={customers}
            recentTransactions={recentTransactions}
        />
    );
}

export default async function OrderPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const resolvedSearchParams = await searchParams;
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) {
        redirect("/login");
    }

    if (activeOrg.businessType === "laundry") {
        return renderLaundryOrderPage(resolvedSearchParams);
    }

    if (activeOrg.businessType === "retail") {
        return renderRetailPosPage();
    }

    redirect("/");
}

