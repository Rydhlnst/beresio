"use server";

import { apiClient } from "@/lib/api-client";
import { buildBranchScopedHeaders, persistActiveBranchId } from "@/lib/branch-context.server";

type TransactionItemInput = {
    productId: string;
    quantity: number;
    unitPrice: number;
};

export type CreateTransactionInput = {
    branchId: string;
    customerId?: string | null;
    paymentMethod?: "cash" | "transfer" | "qris" | null;
    type?: "sale" | "dp" | "pelunasan" | "refund";
    status?: "pending" | "paid" | "refunded";
    discountAmount?: number;
    taxAmount?: number;
    notes?: string | null;
    items: TransactionItemInput[];
};

export async function createTransactionAction(input: CreateTransactionInput) {
    await persistActiveBranchId(input.branchId);
    const headers = await buildBranchScopedHeaders({ branchId: input.branchId });
    const res = await (apiClient as any).api.dashboard.transactions.$post(
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
