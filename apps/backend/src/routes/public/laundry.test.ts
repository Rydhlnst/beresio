import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "../dashboard/test-utils";

vi.mock("../../lib/realtime", () => ({
    createUpstashClient: vi.fn(() => ({
        enabled: false,
        get: vi.fn(async () => null),
        set: vi.fn(async () => undefined),
    })),
}));

import { publicLaundryRouter } from "./laundry";

const createPublicLaundryApp = (db: any) => createTestApp(publicLaundryRouter, "/api/public/laundry", db);

describe("public laundry routes", () => {
    it("GET /tenants/:tenantSlug returns tenant profile with branch mode", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "org-1",
                    slug: "laundry-demo",
                    name: "Laundry Demo",
                    logoUrl: null,
                    logo: null,
                    metadata: "{\"publicOrder\":{\"description\":\"Order cepat\"}}",
                    businessType: "laundry",
                }],
                [{
                    id: "br-1",
                    name: "Cabang Utama",
                    code: "UTAMA",
                    address: "Jl. Merdeka 123",
                    phone: "0812",
                    isActive: true,
                }],
            ],
        });
        const app = createPublicLaundryApp(db);

        const res = await app.request("/api/public/laundry/tenants/laundry-demo");
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.tenant.name).toBe("Laundry Demo");
        expect(body.data.branchMode).toBe("single");
        expect(body.data.defaultBranch.branchSlug).toBe("utama");
    });

    it("POST /order-intakes rejects payload without Idempotency-Key", async () => {
        const app = createPublicLaundryApp(createDbMock());

        const res = await app.request("/api/public/laundry/order-intakes", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                tenantSlug: "laundry-demo",
                branchSlug: "utama",
                customerName: "Dina",
                customerPhone: "08123456789",
                customerAddress: "Jl. Mangga No 12",
                consentAccepted: true,
                items: [{ serviceId: "svc-1", qty: 1, unit: "kg" }],
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("Idempotency-Key");
    });

    it("POST /order-intakes replays stored idempotent response", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "org-1",
                    slug: "laundry-demo",
                    name: "Laundry Demo",
                    logoUrl: null,
                    logo: null,
                    metadata: "{}",
                    businessType: "laundry",
                }],
                [{
                    id: "br-1",
                    name: "Cabang Utama",
                    code: "UTAMA",
                    address: "Jl. Merdeka 123",
                    phone: "0812",
                    isActive: true,
                }],
                 [{
                     requestHash: null,
                     responseStatus: 200,
                     responseBody: {
                         success: true,
                         data: {
                             intakeId: "intake-1",
                             referenceCode: "LDR-260401-ABC123",
                             status: "pending_verification",
                             riskLevel: "low",
                             riskFlags: [],
                             riskNotice: null,
                         },
                     },
                 }],
                [{
                    requestHash: null,
                    responseStatus: 200,
                    responseBody: {
                        success: true,
                        data: {
                            intakeId: "intake-1",
                            referenceCode: "LDR-260401-ABC123",
                            status: "pending_verification",
                            riskLevel: "low",
                            riskFlags: [],
                            riskNotice: null,
                        },
                    },
                }],
                [{
                    requestHash: null,
                    responseStatus: 200,
                    responseBody: {
                        success: true,
                        data: {
                            intakeId: "intake-1",
                            referenceCode: "LDR-260401-ABC123",
                            status: "pending_verification",
                            riskLevel: "low",
                            riskFlags: [],
                            riskNotice: null,
                        },
                    },
                }],
             ],
         });
        const app = createPublicLaundryApp(db);

        const res = await app.request("/api/public/laundry/order-intakes", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "Idempotency-Key": "idem-1",
            },
            body: JSON.stringify({
                tenantSlug: "laundry-demo",
                branchSlug: "utama",
                customerName: "Dina",
                customerPhone: "08123456789",
                customerAddress: "Jl. Mangga No 12",
                consentAccepted: true,
                items: [{ serviceId: "svc-1", qty: 1, unit: "kg" }],
            }),
        });
        const raw = await res.text();
        const body = JSON.parse(raw) as any;

        expect(res.status, raw).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.referenceCode).toBe("LDR-260401-ABC123");
    });
});
