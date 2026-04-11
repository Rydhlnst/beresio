"use server";

import { apiClient } from "@/lib/api-client";
import { buildBranchScopedHeaders, persistActiveBranchId } from "@/lib/branch-context.server";

// ============================================
// PRODUCT ACTIONS
// ============================================

type CreateProductInput = {
    name: string;
    sku?: string | null;
    unit?: string;
    imageUrl?: string | null;
};

type UpdateProductInput = {
    name?: string;
    sku?: string | null;
    unit?: string;
    imageUrl?: string | null;
    isActive?: boolean;
};

export async function createProductAction(input: CreateProductInput) {
    const headers = await buildBranchScopedHeaders();
    const res = await (apiClient as any).api.dashboard.inventory.products.$post(
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

export async function updateProductAction(productId: string, input: UpdateProductInput) {
    const headers = await buildBranchScopedHeaders();
    const res = await (apiClient as any).api.dashboard.inventory.products[":id"].$patch(
        { param: { id: productId }, json: input },
        { headers }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function deleteProductAction(productId: string) {
    const headers = await buildBranchScopedHeaders();
    const res = await (apiClient as any).api.dashboard.inventory.products[":id"].$delete(
        { param: { id: productId } },
        { headers }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

// ============================================
// ADJUSTMENT & TRANSFER ACTIONS
// ============================================

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
    await persistActiveBranchId(input.branchId);
    const headers = await buildBranchScopedHeaders({ branchId: input.branchId });
    const res = await (apiClient as any).api.dashboard.inventory.adjustments.$post(
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

export async function createInventoryTransferAction(input: TransferInput) {
    await persistActiveBranchId(input.fromBranchId);
    const headers = await buildBranchScopedHeaders({ branchId: input.fromBranchId });
    const res = await (apiClient as any).api.dashboard.inventory.transfers.$post(
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

export async function updateInventoryTransferStatusAction(
    transferId: string,
    status: "approved" | "rejected" | "cancelled"
) {
    const headers = await buildBranchScopedHeaders();
    const res = await (apiClient as any).api.dashboard.inventory.transfers[":id"].$patch(
        { param: { id: transferId }, json: { status } },
        { headers }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
