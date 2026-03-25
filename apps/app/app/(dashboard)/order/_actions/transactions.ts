"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

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
    const cookie = (await cookies()).toString();
    const res = await (apiClient as any).api.dashboard.transactions.$post(
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
