export type SettlePaymentInput = {
    organizationId: string;
    branchId: string;
    orderId: string;
    orderNumber?: string;
    amount: number;
    currency?: string;
    idempotencyKey: string;
    customerName?: string | null;
    customerPhone?: string | null;
    paymentMethod?: string | null;
    metadata?: Record<string, unknown>;
};

export type SettlePaymentResult = {
    provider: string;
    providerTransactionId: string;
    status: "PENDING" | "SETTLED" | "FAILED";
    raw?: Record<string, unknown>;
};

export type ReconcilePaymentInput = {
    providerTransactionId: string;
};

export type ReconcilePaymentResult = {
    provider: string;
    providerTransactionId: string;
    status: "PENDING" | "SETTLED" | "FAILED";
    raw?: Record<string, unknown>;
};

export interface PaymentProviderAdapter {
    name: string;
    settlePayment(input: SettlePaymentInput): Promise<SettlePaymentResult>;
    reconcilePayment?(input: ReconcilePaymentInput): Promise<ReconcilePaymentResult>;
    verifyWebhookSignature?(input: {
        rawBody: string;
        headers: Record<string, string>;
    }): Promise<boolean>;
}

export type PaymentProviderEnv = {
    LAUNDRY_PAYMENT_PROVIDER?: string;
    LAUNDRY_PAYMENT_TIMEOUT_MS?: string;
    XENDIT_SECRET_KEY?: string;
    XENDIT_BASE_URL?: string;
    XENDIT_WEBHOOK_SECRET?: string;
    MIDTRANS_SERVER_KEY?: string;
    MIDTRANS_BASE_URL?: string;
    MIDTRANS_WEBHOOK_SECRET?: string;
};

const DEFAULT_TIMEOUT_MS = 12_000;

function getTimeoutMs(env: PaymentProviderEnv) {
    const parsed = Number(env.LAUNDRY_PAYMENT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
    return Math.min(60_000, Math.max(1_000, Math.floor(parsed)));
}

function sanitizeBaseUrl(input: string | undefined, fallback: string) {
    const value = (input ?? fallback).trim();
    return value.replace(/\/+$/, "");
}

function toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
}

async function fetchJson<T = Record<string, unknown>>(input: {
    url: string;
    method?: "GET" | "POST";
    timeoutMs: number;
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
    try {
        const response = await fetch(input.url, {
            method: input.method ?? "POST",
            headers: {
                "content-type": "application/json",
                ...(input.headers ?? {}),
            },
            body: input.body ? JSON.stringify(input.body) : undefined,
            signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(`Payment provider ${response.status}: ${JSON.stringify(payload).slice(0, 300)}`);
        }
        return payload as T;
    } finally {
        clearTimeout(timeout);
    }
}

async function hmacSha256Hex(secret: string, value: string) {
    const keyData = new TextEncoder().encode(secret);
    const messageData = new TextEncoder().encode(value);
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

    async reconcilePayment(input: ReconcilePaymentInput): Promise<ReconcilePaymentResult> {
        return {
            provider: this.name,
            providerTransactionId: input.providerTransactionId,
            status: "SETTLED",
            raw: { mode: "manual" },
        };
    }
}

export class XenditPaymentProviderAdapter implements PaymentProviderAdapter {
    name = "xendit";
    private readonly secretKey: string;
    private readonly webhookSecret?: string;
    private readonly baseUrl: string;
    private readonly timeoutMs: number;

    constructor(env: PaymentProviderEnv) {
        this.secretKey = (env.XENDIT_SECRET_KEY ?? "").trim();
        this.webhookSecret = (env.XENDIT_WEBHOOK_SECRET ?? "").trim() || undefined;
        this.baseUrl = sanitizeBaseUrl(env.XENDIT_BASE_URL, "https://api.xendit.co");
        this.timeoutMs = getTimeoutMs(env);
    }

    async settlePayment(input: SettlePaymentInput): Promise<SettlePaymentResult> {
        if (!this.secretKey) {
            throw new Error("XENDIT_SECRET_KEY is required");
        }

        const externalId = `laundry-${input.orderNumber ?? input.orderId}-${input.idempotencyKey}`;
        const payload = await fetchJson<Record<string, unknown>>({
            url: `${this.baseUrl}/v2/invoices`,
            method: "POST",
            timeoutMs: this.timeoutMs,
            headers: {
                authorization: `Basic ${btoa(`${this.secretKey}:`)}`,
                "x-idempotency-key": input.idempotencyKey,
            },
            body: {
                external_id: externalId,
                amount: input.amount,
                currency: input.currency ?? "IDR",
                description: `Laundry order ${input.orderNumber ?? input.orderId}`,
                payer_email: undefined,
                customer: {
                    given_names: input.customerName ?? "Laundry Customer",
                    mobile_number: input.customerPhone ?? undefined,
                },
                metadata: {
                    organizationId: input.organizationId,
                    branchId: input.branchId,
                    orderId: input.orderId,
                    ...toRecord(input.metadata),
                },
            },
        });

        const statusRaw = String(payload.status ?? "PENDING").toUpperCase();
        const status = statusRaw === "PAID"
            ? "SETTLED"
            : (statusRaw === "EXPIRED" || statusRaw === "FAILED" ? "FAILED" : "PENDING");

        return {
            provider: this.name,
            providerTransactionId: String(payload.id ?? payload.external_id ?? externalId),
            status,
            raw: payload,
        };
    }

    async reconcilePayment(input: ReconcilePaymentInput): Promise<ReconcilePaymentResult> {
        if (!this.secretKey) {
            throw new Error("XENDIT_SECRET_KEY is required");
        }
        const payload = await fetchJson<Record<string, unknown>>({
            url: `${this.baseUrl}/v2/invoices/${encodeURIComponent(input.providerTransactionId)}`,
            method: "GET",
            timeoutMs: this.timeoutMs,
            headers: {
                authorization: `Basic ${btoa(`${this.secretKey}:`)}`,
            },
        });

        const statusRaw = String(payload.status ?? "PENDING").toUpperCase();
        const status = statusRaw === "PAID"
            ? "SETTLED"
            : (statusRaw === "EXPIRED" || statusRaw === "FAILED" ? "FAILED" : "PENDING");

        return {
            provider: this.name,
            providerTransactionId: input.providerTransactionId,
            status,
            raw: payload,
        };
    }

    async verifyWebhookSignature(input: { rawBody: string; headers: Record<string, string> }): Promise<boolean> {
        if (!this.webhookSecret) return false;
        const token = input.headers["x-callback-token"] ?? "";
        if (token) return token === this.webhookSecret;
        const signature = (input.headers["x-signature"] ?? "").toLowerCase().trim();
        if (!signature) return false;
        const computed = await hmacSha256Hex(this.webhookSecret, input.rawBody);
        return signature === computed;
    }
}

export class MidtransPaymentProviderAdapter implements PaymentProviderAdapter {
    name = "midtrans";
    private readonly serverKey: string;
    private readonly webhookSecret?: string;
    private readonly baseUrl: string;
    private readonly timeoutMs: number;

    constructor(env: PaymentProviderEnv) {
        this.serverKey = (env.MIDTRANS_SERVER_KEY ?? "").trim();
        this.webhookSecret = (env.MIDTRANS_WEBHOOK_SECRET ?? "").trim() || undefined;
        this.baseUrl = sanitizeBaseUrl(env.MIDTRANS_BASE_URL, "https://api.midtrans.com");
        this.timeoutMs = getTimeoutMs(env);
    }

    async settlePayment(input: SettlePaymentInput): Promise<SettlePaymentResult> {
        if (!this.serverKey) {
            throw new Error("MIDTRANS_SERVER_KEY is required");
        }

        const orderId = `${input.orderNumber ?? input.orderId}-${input.idempotencyKey}`;
        const payload = await fetchJson<Record<string, unknown>>({
            url: `${this.baseUrl}/v2/charge`,
            method: "POST",
            timeoutMs: this.timeoutMs,
            headers: {
                authorization: `Basic ${btoa(`${this.serverKey}:`)}`,
                "x-idempotency-key": input.idempotencyKey,
            },
            body: {
                payment_type: input.paymentMethod ?? "bank_transfer",
                transaction_details: {
                    order_id: orderId,
                    gross_amount: input.amount,
                },
                customer_details: {
                    first_name: input.customerName ?? "Laundry Customer",
                    phone: input.customerPhone ?? undefined,
                },
                custom_field1: input.orderId,
                custom_field2: input.branchId,
                custom_field3: input.organizationId,
            },
        });

        const statusRaw = String(payload.transaction_status ?? payload.status_code ?? "pending").toLowerCase();
        const status = statusRaw === "settlement" || statusRaw === "capture"
            ? "SETTLED"
            : (statusRaw === "deny" || statusRaw === "cancel" || statusRaw === "expire" ? "FAILED" : "PENDING");

        return {
            provider: this.name,
            providerTransactionId: String(payload.transaction_id ?? payload.order_id ?? orderId),
            status,
            raw: payload,
        };
    }

    async reconcilePayment(input: ReconcilePaymentInput): Promise<ReconcilePaymentResult> {
        if (!this.serverKey) {
            throw new Error("MIDTRANS_SERVER_KEY is required");
        }
        const payload = await fetchJson<Record<string, unknown>>({
            url: `${this.baseUrl}/v2/${encodeURIComponent(input.providerTransactionId)}/status`,
            method: "GET",
            timeoutMs: this.timeoutMs,
            headers: {
                authorization: `Basic ${btoa(`${this.serverKey}:`)}`,
            },
        });

        const statusRaw = String(payload.transaction_status ?? "pending").toLowerCase();
        const status = statusRaw === "settlement" || statusRaw === "capture"
            ? "SETTLED"
            : (statusRaw === "deny" || statusRaw === "cancel" || statusRaw === "expire" ? "FAILED" : "PENDING");

        return {
            provider: this.name,
            providerTransactionId: input.providerTransactionId,
            status,
            raw: payload,
        };
    }

    async verifyWebhookSignature(input: { rawBody: string; headers: Record<string, string> }): Promise<boolean> {
        if (!this.webhookSecret) return false;
        const signature = (input.headers["x-signature-key"] ?? input.headers["signature_key"] ?? "").toLowerCase().trim();
        if (!signature) return false;
        const computed = await hmacSha256Hex(this.webhookSecret, input.rawBody);
        return signature === computed;
    }
}

export function resolvePaymentProviderAdapter(env: PaymentProviderEnv): PaymentProviderAdapter {
    const provider = (env.LAUNDRY_PAYMENT_PROVIDER ?? "manual").trim().toLowerCase();
    if (provider === "xendit") return new XenditPaymentProviderAdapter(env);
    if (provider === "midtrans") return new MidtransPaymentProviderAdapter(env);
    return new ManualPaymentProviderAdapter();
}
