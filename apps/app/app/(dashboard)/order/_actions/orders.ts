"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

type OrderItemInput = {
    name: string;
    quantity: number;
    unitPrice: number;
};

export type CreateOrderInput = {
    branchId: string;
    customerId?: string | null;
    type: "pickup" | "delivery" | "walk_in";
    status?: "pending" | "processing" | "completed" | "cancelled";
    paymentStatus?: "pending" | "paid" | "refunded" | "failed";
    paymentMethod?: string | null;
    discountAmount?: number;
    taxAmount?: number;
    notes?: string | null;
    eventNote?: string | null;
    items: OrderItemInput[];
};

export type UpdateOrderInput = {
    status?: "pending" | "processing" | "completed" | "cancelled";
    type?: "pickup" | "delivery" | "walk_in";
    paymentStatus?: "pending" | "paid" | "refunded" | "failed";
    paymentMethod?: string | null;
    notes?: string | null;
    customerId?: string | null;
    eventNote?: string | null;
};

export async function createOrderAction(input: CreateOrderInput) {
    const cookie = (await cookies()).toString();
    const res = await (apiClient as any).api.dashboard.orders.$post(
        { json: input },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function updateOrderAction(orderId: string, input: UpdateOrderInput) {
    const cookie = (await cookies()).toString();
    const res = await (apiClient as any).api.dashboard.orders[":id"].$patch(
        { param: { id: orderId }, json: input },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function updateOrderItemsAction(orderId: string, items: OrderItemInput[]) {
    const cookie = (await cookies()).toString();
    const res = await (apiClient as any).api.dashboard.orders[":id"].items.$patch(
        { param: { id: orderId }, json: { items, eventNote: "Item order diperbarui" } },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
