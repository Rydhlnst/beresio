import Link from "next/link";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { apiClient } from "@/lib/api-client";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import LaundryOrderDetailClient from "./laundry-order-detail-client";

type LaundryOrderDetailPageProps = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: LaundryOrderDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Order Laundry ${id}`,
        description: "Detail order laundry, timeline, status, dan pembayaran.",
    };
}

export default async function LaundryOrderDetailPage({ params }: LaundryOrderDetailPageProps) {
    const { id } = await params;
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const [orderRes, receiptRes] = await Promise.all([
        rpc.api.dashboard.laundry.orders[":id"].$get(
            { param: { id } },
            { headers: { cookie } }
        ),
        rpc.api.dashboard.laundry.orders[":id"].receipt.$get(
            { param: { id } },
            { headers: { cookie } }
        ),
    ]);

    if (!orderRes.ok) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Detail Order Laundry</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Order ID: {id}</p>
                    </div>
                    <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                        <Link href="/laundry/orders">Kembali</Link>
                    </Button>
                </div>
                <PageErrorState
                    title="Order tidak ditemukan atau tidak dapat diakses"
                    description="Periksa kembali ID order atau hak akses branch."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const order = ((await orderRes.json().catch(() => ({}))) as any)?.data ?? null;
    const [driversRes, machinesRes] = order
        ? await Promise.all([
            rpc.api.dashboard.laundry.drivers.$get(undefined, { headers: { cookie } }),
            rpc.api.dashboard.laundry.machines.$get(
                {
                    query: { branchId: order.branchId },
                },
                { headers: { cookie } }
            ),
        ])
        : [null, null];
    const drivers = driversRes?.ok
        ? ((((await driversRes.json().catch(() => ({}))) as any)?.data ?? []) as any[])
        : [];
    const machines = machinesRes?.ok
        ? ((((await machinesRes.json().catch(() => ({}))) as any)?.data ?? []) as any[])
        : [];
    const receiptPayload = receiptRes.ok ? (((await receiptRes.json().catch(() => ({}))) as any)?.data ?? null) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Detail Order Laundry</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {order?.orderNumber ?? id} • {order?.status ?? "-"}
                    </p>
                </div>
                <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                    <Link href="/laundry/orders">Kembali</Link>
                </Button>
            </div>

            {receiptPayload ? (
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Template Receipt / WA</h2>
                    <pre className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                        {receiptPayload.waMessageText}
                    </pre>
                </div>
            ) : null}

            {order ? <LaundryOrderDetailClient order={order} drivers={drivers} machines={machines} /> : null}
        </div>
    );
}



