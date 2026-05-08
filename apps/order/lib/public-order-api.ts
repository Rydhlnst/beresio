export type PublicTenantInfo = {
    slug: string;
    name: string;
    logoUrl: string | null;
    description: string | null;
    whatsappPhone: string | null;
};

export type PublicTenantBranch = {
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    branchSlug: string;
};

export type PublicLaundryService = {
    id: string;
    name: string;
    unit: string;
    basePrice: number;
    estimatedDurationHours: number;
};

export type PublicTenantPayload = {
    tenant: PublicTenantInfo;
    branchMode: "single" | "multi";
    defaultBranch: PublicTenantBranch | null;
    branchCount: number;
};

export type PublicBranchPayload = {
    tenant: PublicTenantInfo;
    branches: PublicTenantBranch[];
};

export type PublicServicesPayload = {
    tenant: PublicTenantInfo;
    branch: PublicTenantBranch;
    constraints: {
        minPhoneDigits: number;
        maxPhoneDigits: number;
        pickupHorizonDays: number;
    };
    services: PublicLaundryService[];
};

export type PublicOrderIntakeResponse = {
    intakeId: string;
    referenceCode: string;
    status: string;
    riskLevel: "low" | "medium" | "high";
    riskFlags: string[];
    riskNotice: string | null;
};

export type PublicOrderIntakeStatus = {
    id: string;
    referenceCode: string;
    status: string;
    riskLevel: "low" | "medium" | "high";
    riskFlags: string[];
    customerName: string;
    branchId: string;
    branchName: string | null;
    tenantSlug: string;
    branchSlug: string;
    createdAt: string;
    verifiedAt: string | null;
};

type ApiEnvelope<T> = {
    success: boolean;
    data: T;
    error?: { code?: string; message?: string };
};

function getApiBaseUrl() {
    return (
        process.env.NEXT_PUBLIC_API_URL
        || process.env.BERES_PUBLIC_API_URL
        || "http://localhost:8787"
    ).replace(/\/+$/, "");
}

async function requestApi<T>(path: string, init?: RequestInit) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init?.headers ?? {}),
        },
        cache: "no-store",
    });

    let json: ApiEnvelope<T> | null = null;
    try {
        json = (await response.json()) as ApiEnvelope<T>;
    } catch {
        json = null;
    }
    if (!response.ok || !json?.success) {
        const message = json?.error?.message || `Request failed (${response.status})`;
        throw new Error(message);
    }
    return json.data;
}

export async function fetchPublicTenant(tenantSlug: string) {
    return requestApi<PublicTenantPayload>(`/api/public/laundry/tenants/${encodeURIComponent(tenantSlug)}`);
}

export async function fetchPublicBranches(tenantSlug: string) {
    return requestApi<PublicBranchPayload>(`/api/public/laundry/tenants/${encodeURIComponent(tenantSlug)}/branches`);
}

export async function fetchPublicLaundryServices(tenantSlug: string, branchSlug: string) {
    return requestApi<PublicServicesPayload>(
        `/api/public/laundry/tenants/${encodeURIComponent(tenantSlug)}/branches/${encodeURIComponent(branchSlug)}/services`
    );
}

export async function submitPublicOrderIntake(
    payload: Record<string, unknown>,
    idempotencyKey: string
) {
    return requestApi<PublicOrderIntakeResponse>("/api/public/laundry/order-intakes", {
        method: "POST",
        headers: {
            "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
    });
}

export async function fetchPublicOrderIntakeStatus(referenceCode: string) {
    return requestApi<PublicOrderIntakeStatus>(
        `/api/public/laundry/order-intakes/${encodeURIComponent(referenceCode)}`
    );
}

export async function submitPublicOrderFunnelEvent(payload: {
    tenantSlug: string;
    branchSlug: string;
    sessionId: string;
    channel?: "whatsapp_link" | "web_direct";
    eventType: "session_started" | "session_abandoned" | "session_submitted";
    metadata?: Record<string, unknown>;
}) {
    return requestApi<{ accepted: boolean }>("/api/public/laundry/funnel-events", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
