"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { apiClient } from "@/lib/api-client";
const rpc = apiClient as any;

type ActionResult<T = unknown> = {
    ok: boolean;
    data?: T;
    error?: string;
};

async function withCookieHeaders() {
    const cookie = (await headers()).get("cookie") || "";
    return { cookie };
}

async function toActionResult<T>(response: Response): Promise<ActionResult<T>> {
    if (!response.ok) {
        const message = await response.text().catch(() => "Request failed");
        return { ok: false, error: message || "Request failed" };
    }
    const payload = await response.json().catch(() => ({ data: null }));
    return { ok: true, data: (payload as { data?: T }).data };
}

export async function createLaundryOrderAction(input: {
    branchId: string;
    customerId?: string | null;
    orderType: "walk_in" | "pickup" | "drop_off";
    customerName?: string | null;
    customerPhone?: string | null;
    customerAddress?: string | null;
    notes?: string | null;
    discountAmount?: number;
    taxAmount?: number;
    initialPaymentAmount?: number;
    paymentMethod?: string | null;
    items: Array<{
        serviceId?: string;
        name?: string;
        quantity: number;
        unitPrice?: number;
        estimatedDurationHours?: number;
        notes?: string | null;
    }>;
}) {
    const cookieHeaders = await withCookieHeaders();
    const res = await rpc.api.dashboard.laundry.orders.$post(
        {
            json: input,
        },
        {
            headers: cookieHeaders,
        }
    );
    const result = await toActionResult<{ id: string }>(res);
    if (result.ok) {
        revalidatePath("/laundry");
        revalidatePath("/laundry/orders");
        revalidatePath("/order");
        revalidatePath("/pickup");
    }
    return result;
}

export async function updateLaundryOrderStatusAction(orderId: string, input: { status: string; note?: string | null }) {
    const cookieHeaders = await withCookieHeaders();
    const res = await rpc.api.dashboard.laundry.orders[":id"].status.$patch(
        {
            param: { id: orderId },
            json: input,
        },
        {
            headers: cookieHeaders,
        }
    );
    const result = await toActionResult(res);
    if (result.ok) {
        revalidatePath(`/laundry/orders/${orderId}`);
        revalidatePath("/laundry/orders");
        revalidatePath("/laundry");
    }
    return result;
}

export async function assignLaundryDriverAction(
    orderId: string,
    input: { driverId: string | null }
) {
    const cookieHeaders = await withCookieHeaders();
    const res = await rpc.api.dashboard.laundry.orders[":id"].driver.$patch(
        {
            param: { id: orderId },
            json: input,
        },
        {
            headers: cookieHeaders,
        }
    );
    const result = await toActionResult(res);
    if (result.ok) {
        revalidatePath(`/laundry/orders/${orderId}`);
        revalidatePath("/laundry/orders");
    }
    return result;
}

export async function recordLaundryPaymentAction(
    orderId: string,
    input: { amount: number; paymentMethod?: string | null; note?: string | null }
) {
    const cookieHeaders = await withCookieHeaders();
    const res = await rpc.api.dashboard.laundry.orders[":id"].payments.$post(
        {
            param: { id: orderId },
            json: input,
        },
        {
            headers: cookieHeaders,
        }
    );
    const result = await toActionResult(res);
    if (result.ok) {
        revalidatePath(`/laundry/orders/${orderId}`);
        revalidatePath("/laundry/orders");
        revalidatePath("/laundry/reports");
        revalidatePath("/laundry");
    }
    return result;
}

export async function createLaundryServiceAction(input: {
    branchId: string;
    name: string;
    unit?: string;
    basePrice: number;
    estimatedDurationHours?: number;
    isActive?: boolean;
}) {
    const cookieHeaders = await withCookieHeaders();
    const res = await rpc.api.dashboard.laundry.services.$post(
        {
            json: input,
        },
        {
            headers: cookieHeaders,
        }
    );
    const result = await toActionResult(res);
    if (result.ok) {
        revalidatePath("/laundry/services");
        revalidatePath("/laundry/orders/new");
    }
    return result;
}

export async function updateLaundryServiceAction(input: {
    id: string;
    name?: string;
    unit?: string;
    basePrice?: number;
    estimatedDurationHours?: number;
    isActive?: boolean;
}) {
    const cookieHeaders = await withCookieHeaders();
    const res = await rpc.api.dashboard.laundry.services.$patch(
        {
            json: input,
        },
        {
            headers: cookieHeaders,
        }
    );
    const result = await toActionResult(res);
    if (result.ok) {
        revalidatePath("/laundry/services");
        revalidatePath("/laundry/orders/new");
    }
    return result;
}
