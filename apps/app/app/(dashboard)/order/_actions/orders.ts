"use server";

import { apiClient } from "@/lib/api-client";
import type { OrderStatusInput, OrderTypeInput } from "@beresio/db";
import { buildBranchScopedHeaders, persistActiveBranchId } from "@/lib/branch-context.server";

type OrderItemInput = {
    name: string;
    quantity: number;
    unitPrice: number;
    inventoryProductId?: string | null;
    sku?: string | null;
};

export type CreateOrderInput = {
    branchId: string;
    customerId?: string | null;
    type: OrderTypeInput;
    status?: OrderStatusInput;
    paymentStatus?: "pending" | "paid" | "refunded" | "failed";
    paymentMethod?: string | null;
    discountAmount?: number;
    taxAmount?: number;
    notes?: string | null;
    eventNote?: string | null;
    items: OrderItemInput[];
};

export type UpdateOrderInput = {
    status?: OrderStatusInput;
    type?: OrderTypeInput;
    paymentStatus?: "pending" | "paid" | "refunded" | "failed";
    paymentMethod?: string | null;
    notes?: string | null;
    customerId?: string | null;
    eventNote?: string | null;
};

export async function createOrderAction(input: CreateOrderInput) {
    await persistActiveBranchId(input.branchId);
    const headers = await buildBranchScopedHeaders({ branchId: input.branchId });
    const res = await (apiClient as any).api.dashboard.orders.$post(
        { json: input },
        { headers }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function updateOrderAction(orderId: string, input: UpdateOrderInput) {
    const headers = await buildBranchScopedHeaders();
    const res = await (apiClient as any).api.dashboard.orders[":id"].$patch(
        { param: { id: orderId }, json: input },
        { headers }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function updateOrderItemsAction(orderId: string, items: OrderItemInput[]) {
    const headers = await buildBranchScopedHeaders();
    const res = await (apiClient as any).api.dashboard.orders[":id"].items.$patch(
        { param: { id: orderId }, json: { items, eventNote: "Item order diperbarui" } },
        { headers }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
