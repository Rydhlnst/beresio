"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

type AdjustmentInput = {
    productId: string;
    branchId: string;
    quantityDelta: number;
    reason?: string;
};

type TransferInput = {
    fromBranchId: string;
    toBranchId: string;
    productId: string;
    quantity: number;
    note?: string;
};

export async function createInventoryAdjustmentAction(input: AdjustmentInput) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.inventory.adjustments.$post(
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

export async function createInventoryTransferAction(input: TransferInput) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.inventory.transfers.$post(
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

export async function updateInventoryTransferStatusAction(
    transferId: string,
    status: "approved" | "rejected" | "cancelled"
) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.inventory.transfers[":id"].$patch(
        { param: { id: transferId }, json: { status } },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
