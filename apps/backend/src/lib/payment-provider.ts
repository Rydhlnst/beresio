export type SettlePaymentInput = {
    organizationId: string;
    branchId: string;
    orderId: string;
    amount: number;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
};

export type SettlePaymentResult = {
    provider: string;
    providerTransactionId: string;
    status: "PENDING" | "SETTLED" | "FAILED";
    raw?: Record<string, unknown>;
};

export interface PaymentProviderAdapter {
    name: string;
    settlePayment(input: SettlePaymentInput): Promise<SettlePaymentResult>;
    verifyWebhookSignature?(input: {
        rawBody: string;
        headers: Record<string, string>;
    }): Promise<boolean>;
}

/**
 * Q3 placeholder adapter.
 * Online gateway implementation (e.g. Xendit) will be introduced in Q4.
 */
export class ManualPaymentProviderAdapter implements PaymentProviderAdapter {
    name = "manual";

    async settlePayment(input: SettlePaymentInput): Promise<SettlePaymentResult> {
        return {
            provider: this.name,
            providerTransactionId: `manual:${input.orderId}:${input.idempotencyKey}`,
            status: "SETTLED",
            raw: {
                mode: "manual",
                amount: input.amount,
            },
        };
    }
}
