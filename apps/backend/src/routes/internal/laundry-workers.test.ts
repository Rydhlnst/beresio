import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "../dashboard/test-utils";
import { internalLaundryWorkersRouter } from "./laundry-workers";

const createApp = (db: any) => createTestApp(internalLaundryWorkersRouter, "/api/internal/laundry", db);

describe("internal laundry workers route", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("rejects request without internal key", async () => {
        const app = createApp(createDbMock());
        const res = await app.request(
            "/api/internal/laundry/notifications/dispatch",
            { method: "POST" },
            { INTERNAL_API_SECRET: "internal-secret" } as any
        );
        expect(res.status).toBe(401);
    });

    it("dispatches queued outbox record and marks as sent", async () => {
        const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
        vi.stubGlobal("fetch", fetchMock as any);

        const db = createDbMock({
            selectResults: [[{
                id: "outbox-1",
                organizationId: "org-1",
                branchId: "br-1",
                orderId: "ord-1",
                templateSnapshot: "Halo {{customerName}}, order {{orderNumber}} status terbaru: {{status}}.",
                payload: {
                    customerName: "Budi",
                    customerPhone: "0812 3456 789",
                    orderNumber: "LDR-001",
                    status: "ready",
                    remainingAmount: 12000,
                },
                attemptCount: 0,
                status: "queued",
                nextRetryAt: null,
            }]],
            updateResults: [
                [{
                    id: "outbox-1",
                    organizationId: "org-1",
                    branchId: "br-1",
                    orderId: "ord-1",
                    templateSnapshot: "Halo {{customerName}}, order {{orderNumber}} status terbaru: {{status}}.",
                    payload: {
                        customerName: "Budi",
                        customerPhone: "0812 3456 789",
                        orderNumber: "LDR-001",
                        status: "ready",
                        remainingAmount: 12000,
                    },
                    attemptCount: 1,
                }],
                [],
            ],
        });

        const app = createApp(db);
        const env = {
            INTERNAL_API_SECRET: "internal-secret",
            LAUNDRY_WA_PROVIDER_URL: "https://wa.example/send",
            LAUNDRY_WA_PROVIDER_TOKEN: "token",
        } as any;

        const res = await app.request("/api/internal/laundry/notifications/dispatch?limit=1", {
            method: "GET",
            headers: { "x-internal-api-key": "internal-secret" },
        }, env);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            scanned: 1,
            claimed: 1,
            sent: 1,
            failed: 0,
            deadLetter: 0,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("moves outbox to dead_letter after max attempts when provider fails", async () => {
        const fetchMock = vi.fn(async () => new Response("provider error", { status: 500 }));
        vi.stubGlobal("fetch", fetchMock as any);

        const db = createDbMock({
            selectResults: [[{
                id: "outbox-2",
                organizationId: "org-1",
                branchId: "br-1",
                orderId: "ord-2",
                templateSnapshot: "Status {{status}} untuk order {{orderNumber}}.",
                payload: {
                    customerName: "Nina",
                    customerPhone: "081234567890",
                    orderNumber: "LDR-002",
                    status: "out_for_delivery",
                    remainingAmount: 0,
                },
                attemptCount: 1,
                status: "failed",
                nextRetryAt: null,
            }]],
            updateResults: [
                [{
                    id: "outbox-2",
                    organizationId: "org-1",
                    branchId: "br-1",
                    orderId: "ord-2",
                    templateSnapshot: "Status {{status}} untuk order {{orderNumber}}.",
                    payload: {
                        customerName: "Nina",
                        customerPhone: "081234567890",
                        orderNumber: "LDR-002",
                        status: "out_for_delivery",
                        remainingAmount: 0,
                    },
                    attemptCount: 2,
                }],
                [],
            ],
        });

        const app = createApp(db);
        const env = {
            INTERNAL_API_SECRET: "internal-secret",
            LAUNDRY_WA_PROVIDER_URL: "https://wa.example/send",
            LAUNDRY_WA_MAX_ATTEMPTS: "2",
        } as any;

        const res = await app.request("/api/internal/laundry/notifications/dispatch?limit=1", {
            method: "GET",
            headers: { "x-internal-api-key": "internal-secret" },
        }, env);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            scanned: 1,
            claimed: 1,
            sent: 0,
            failed: 0,
            deadLetter: 1,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("supports dry-run dispatch without provider URL", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock as any);

        const db = createDbMock({
            selectResults: [[{
                id: "outbox-3",
                organizationId: "org-1",
                branchId: "br-1",
                orderId: "ord-3",
                templateSnapshot: "Status {{status}} untuk order {{orderNumber}}.",
                payload: {
                    customerName: "Rani",
                    customerPhone: "081234500000",
                    orderNumber: "LDR-003",
                    status: "completed",
                    remainingAmount: 0,
                },
                attemptCount: 0,
                status: "queued",
                nextRetryAt: null,
            }]],
            updateResults: [
                [{
                    id: "outbox-3",
                    organizationId: "org-1",
                    branchId: "br-1",
                    orderId: "ord-3",
                    templateSnapshot: "Status {{status}} untuk order {{orderNumber}}.",
                    payload: {
                        customerName: "Rani",
                        customerPhone: "081234500000",
                        orderNumber: "LDR-003",
                        status: "completed",
                        remainingAmount: 0,
                    },
                    attemptCount: 1,
                }],
                [],
            ],
        });

        const app = createApp(db);
        const env = {
            INTERNAL_API_SECRET: "internal-secret",
        } as any;

        const res = await app.request("/api/internal/laundry/notifications/dispatch?limit=1&dryRun=true", {
            method: "GET",
            headers: { "x-internal-api-key": "internal-secret" },
        }, env);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            dryRun: true,
            scanned: 1,
            claimed: 1,
            sent: 1,
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
