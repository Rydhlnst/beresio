import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";
import { resetLaundryRuntimeMetrics } from "../../lib/laundry-metrics";

const { getBranchAccessContextMock } = vi.hoisted(() => ({
    getBranchAccessContextMock: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
}));

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
    getUserId: vi.fn(() => "user-1"),
}));

vi.mock("../../lib/permissions", () => ({
    requireOrganization: async (_c: any, next: any) => {
        await next();
    },
    requirePermission: () => async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: getBranchAccessContextMock,
    hasBranchAccess: (branchIds: string[], branchId: string) => branchIds.includes(branchId),
}));

vi.mock("../../lib/laundry-order-number", () => ({
    generateLaundryOrderNumber: vi.fn(async () => "LDR-20260406-001"),
}));

import { laundryRouter } from "./laundry";

const createLaundryApp = (db: any) => createTestApp(laundryRouter, "/api/dashboard/laundry", db);

describe("laundry routes", () => {
    beforeEach(() => {
        resetLaundryRuntimeMetrics();
    });

    it("[OK] [AC-SVC-01] GET /services returns laundry services list", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "svc-1",
                    branchId: "br-1",
                    name: "Cuci Kiloan",
                    unit: "kg",
                    basePrice: 7000,
                    isActive: true,
                },
            ]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/services?branchId=br-1");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({ name: "Cuci Kiloan" });
    });

    it("[OK] [AC-SVC-02] POST /services creates laundry service", async () => {
        const db = createDbMock({
            insertResults: [[{
                id: "svc-new",
                branchId: "br-1",
                name: "Setrika",
                unit: "kg",
                basePrice: 5000,
                isActive: true,
            }]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/services", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                name: "Setrika",
                unit: "kg",
                basePrice: 5000,
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({ id: "svc-new", name: "Setrika" });
    });

    it("[ERR] [AC-SVC-03] PATCH /services returns 404 when service missing", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/services", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: "svc-missing",
                name: "Express Wash",
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("Service not found");
    });

    it("POST /orders creates order for walk_in with initial payment", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "svc-1",
                    name: "Cuci Kiloan",
                    basePrice: 7000,
                    estimatedDurationHours: 24,
                }],
            ],
            insertResults: [
                [{
                    id: "ord-1",
                    orderNumber: "LDR-20260406-001",
                    orderType: "walk_in",
                    status: "received",
                    customerName: "Dina",
                    customerPhone: "08123456789",
                    customerAddress: null,
                    totalAmount: 14000,
                    paidAmount: 7000,
                    remainingAmount: 7000,
                    paymentStatus: "partial",
                }],
                [],
                [{ id: "pay-1" }],
                [],
                [{ id: "evt-1" }],
                [{ id: "evt-2" }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                orderType: "walk_in",
                customerName: "Dina",
                customerPhone: "0812 3456 789",
                initialPaymentAmount: 7000,
                items: [
                    { serviceId: "svc-1", quantity: 2 },
                ],
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            id: "ord-1",
            orderNumber: "LDR-20260406-001",
            status: "received",
        });
    });

    it("POST /orders rejects pickup without phone/address", async () => {
        const app = createLaundryApp(createDbMock());

        const res = await app.request("/api/dashboard/laundry/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                orderType: "pickup",
                customerName: "Dina",
                items: [{ name: "Cuci", quantity: 1, unitPrice: 10000 }],
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("require customerPhone and customerAddress");
    });

    it("POST /orders rejects customerId without fallback phone/address", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "cus-1",
                name: "Nina",
                phone: null,
                address: null,
            }]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                orderType: "walk_in",
                customerId: "cus-1",
                items: [{ name: "Cuci", quantity: 1, unitPrice: 10000 }],
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("customerId requires phone and address");
    });

    it("POST /orders/:id/payments records partial payment", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    orderNumber: "LDR-20260406-001",
                    paidAmount: 0,
                    totalAmount: 20000,
                    remainingAmount: 20000,
                }],
                [{ roleLegacy: "cashier", roleSlug: null, roleName: null }],
            ],
            insertResults: [
                [{
                    id: "pay-1",
                    amount: 8000,
                    paymentMethod: "cash",
                }],
                [{ id: "evt-pay-1" }],
            ],
            updateResults: [[{
                id: "ord-1",
                paidAmount: 8000,
                remainingAmount: 12000,
                paymentStatus: "partial",
            }]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/payments", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ amount: 8000, paymentMethod: "cash" }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.order).toMatchObject({
            paidAmount: 8000,
            remainingAmount: 12000,
            paymentStatus: "partial",
        });
    });

    it("POST /orders/:id/payments rejects overpayment", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    orderNumber: "LDR-20260406-001",
                    paidAmount: 5000,
                    totalAmount: 10000,
                    remainingAmount: 5000,
                }],
                [{ roleLegacy: "cashier", roleSlug: null, roleName: null }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/payments", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ amount: 6000, paymentMethod: "cash" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("Overpayment");
    });

    it("PATCH /orders/:id/status rejects invalid transition", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "ord-1",
                branchId: "br-1",
                status: "completed",
                assignedDriverId: null,
                orderNumber: "LDR-20260406-001",
                customerName: "Budi",
                customerPhone: "08123",
                remainingAmount: 0,
            }]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "processing" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("Invalid status transition");
    });

    it("PATCH /orders/:id/status allows valid transition and enqueues outbox", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    status: "processing",
                    assignedDriverId: null,
                    orderNumber: "LDR-20260406-001",
                    customerName: "Budi",
                    customerPhone: "08123456789",
                    remainingAmount: 12000,
                }],
                [{ roleLegacy: "laundry_worker", roleSlug: null, roleName: null }],
                [{ metadata: null }],
            ],
            updateResults: [[{
                id: "ord-1",
                status: "ready_for_pickup",
                remainingAmount: 12000,
            }]],
            insertResults: [
                [],
                [{
                    id: "evt-status-1",
                    sequence: 1,
                    organizationId: "org-1",
                    branchId: "br-1",
                    orderId: "ord-1",
                    eventType: "ORDER_STATUS_CHANGED",
                    occurredAt: new Date(),
                    payload: {},
                }],
                [{ id: "outbox-1", status: "queued" }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "ready_for_pickup", note: "Selesai cuci" }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({ status: "ready_for_pickup" });
    });

    it("PATCH /orders/:id/driver enforces assigned scope for driver role", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    assignedDriverId: "user-1",
                    assignedDriverName: "Driver A",
                }],
                [{ roleLegacy: "driver", roleSlug: null, roleName: null }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/driver", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ driverId: "user-2" }),
        });
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
    });

    it("PATCH /orders/:id/driver rejects non-driver target", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    assignedDriverId: null,
                    assignedDriverName: null,
                }],
                [{ roleLegacy: "branch_manager", roleSlug: null, roleName: null }],
                [{
                    userId: "user-2",
                    userName: "Staff A",
                    roleLegacy: "cashier",
                    roleSlug: null,
                    roleName: null,
                }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/driver", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ driverId: "user-2" }),
        });
        const body = await res.json();

        expect([400, 403]).toContain(res.status);
        expect(body.success).toBe(false);
    });

    it("[OK] [AC-DRIVER-01] PATCH /orders/:id/driver derives driver name from user profile", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    assignedDriverId: null,
                    assignedDriverName: null,
                }],
                [{ roleLegacy: "branch_manager", roleSlug: null, roleName: null }],
                [{
                    userId: "driver-1",
                    userName: "Rizky Driver",
                    roleLegacy: "driver",
                    roleSlug: null,
                    roleName: null,
                }],
            ],
            updateResults: [[{
                id: "ord-1",
                assignedDriverId: "driver-1",
                assignedDriverName: "Rizky Driver",
            }]],
            insertResults: [[{
                id: "evt-driver-1",
                sequence: 9,
                organizationId: "org-1",
                branchId: "br-1",
                orderId: "ord-1",
                eventType: "DRIVER_ASSIGNED",
                occurredAt: new Date(),
                payload: {},
            }]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/driver", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ driverId: "driver-1" }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            assignedDriverId: "driver-1",
            assignedDriverName: "Rizky Driver",
        });
    });

    it("[ERR] [AC-DRIVER-02] PATCH /orders/:id/driver rejects unknown driverId with 400", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    assignedDriverId: null,
                    assignedDriverName: null,
                }],
                [{ roleLegacy: "branch_manager", roleSlug: null, roleName: null }],
                [],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/driver", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ driverId: "driver-missing" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("Driver not found in organization");
    });

    it("[OK] [AC-OUTBOX-01] PATCH status to trigger states enqueues notification outbox", async () => {
        const statusCases = ["ready_for_pickup", "out_for_delivery", "completed"] as const;

        for (const targetStatus of statusCases) {
            const db = createDbMock({
                selectResults: [
                    [{
                        id: "ord-1",
                        branchId: "br-1",
                        status: targetStatus === "ready_for_pickup" ? "processing" : "ready_for_pickup",
                        assignedDriverId: targetStatus === "out_for_delivery" || targetStatus === "completed" ? "user-1" : null,
                        orderNumber: "LDR-20260406-001",
                        customerName: "Budi",
                        customerPhone: "08123456789",
                        remainingAmount: 5000,
                    }],
                    [{ roleLegacy: "laundry_worker", roleSlug: null, roleName: null }],
                    [{ metadata: null }],
                ],
                updateResults: [[{
                    id: "ord-1",
                    status: targetStatus,
                    remainingAmount: 5000,
                }]],
                insertResults: [
                    [],
                    [{
                        id: `evt-status-${targetStatus}`,
                        sequence: 1,
                        organizationId: "org-1",
                        branchId: "br-1",
                        orderId: "ord-1",
                        eventType: "ORDER_STATUS_CHANGED",
                        occurredAt: new Date(),
                        payload: {},
                    }],
                    [{ id: `outbox-${targetStatus}`, status: "queued" }],
                ],
            });
            const app = createLaundryApp(db);

            const res = await app.request("/api/dashboard/laundry/orders/ord-1/status", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ status: targetStatus }),
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.status).toBe(targetStatus);
        }
    });

    it("[OK] [AC-METRIC-01] GET /reports/metrics returns reject rate and outbox counts", async () => {
        const db = createDbMock({
            selectResults: [[
                { status: "queued", total: 3 },
                { status: "failed", total: 1 },
                { status: "processing", total: 2 },
                { status: "dead_letter", total: 1 },
            ]],
        });
        const app = createLaundryApp(db);

        const createRes = await app.request("/api/dashboard/laundry/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                orderType: "pickup",
                customerName: "Nina",
                items: [{ name: "Cuci", quantity: 1, unitPrice: 12000 }],
            }),
        });
        expect(createRes.status).toBe(400);

        const metricsRes = await app.request("/api/dashboard/laundry/reports/metrics");
        const body = await metricsRes.json();

        expect(metricsRes.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            createOrderAttempts: 1,
            validationRejects: 1,
            validationRejectRate: 1,
            outboxQueuedCount: 3,
            outboxFailedCount: 1,
        });
        expect(body.data.outboxStatusCounts).toMatchObject({
            queued: 3,
            processing: 2,
            failed: 1,
            deadLetter: 1,
        });
    });

    it("[OK] [AC-REP-02] GET /reports/orders-by-status returns grouped status totals", async () => {
        const db = createDbMock({
            selectResults: [[
                { status: "received", total: 4 },
                { status: "processing", total: 3 },
                { status: "completed", total: 2 },
            ]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/reports/orders-by-status?branchId=br-1");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toEqual([
            { status: "received", total: 4 },
            { status: "processing", total: 3 },
            { status: "completed", total: 2 },
        ]);
    });

    it("[OK] [AC-REP-03] GET /reports/outstanding-payments returns outstanding rows", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "ord-1",
                    orderNumber: "LDR-001",
                    customerName: "Budi",
                    customerPhone: "0812",
                    totalAmount: 20000,
                    paidAmount: 5000,
                    remainingAmount: 15000,
                    status: "processing",
                    createdAt: new Date("2026-04-09T02:00:00.000Z"),
                },
            ]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/reports/outstanding-payments?branchId=br-1&limit=20");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
            orderNumber: "LDR-001",
            remainingAmount: 15000,
        });
    });

    it("[ERR] [AC-WA-01] GET /settings/wa-template rejects missing branchId", async () => {
        const app = createLaundryApp(createDbMock());

        const res = await app.request("/api/dashboard/laundry/settings/wa-template");
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toContain("branchId is required");
    });

    it("[OK] [AC-WA-02] PATCH /settings/wa-template updates template for allowed role", async () => {
        const db = createDbMock({
            selectResults: [
                [{ roleLegacy: "branch_manager", roleSlug: null, roleName: null }],
                [{ metadata: null }],
            ],
            updateResults: [[]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/settings/wa-template", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                template: "Halo {{customerName}}, order {{orderNumber}} siap diambil.",
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({ branchId: "br-1" });
    });

    it("[OK] [AC-ORD-01] GET /orders returns normalized order list", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "ord-1",
                    orderNumber: "LDR-009",
                    status: "received",
                    orderType: "walk_in",
                    totalAmount: 12000,
                    paidAmount: 0,
                    remainingAmount: 12000,
                    paymentStatus: "pending",
                    customerName: "Dina",
                    customerPhone: "08123",
                    customerAddress: null,
                    notes: null,
                    branchId: "br-1",
                    branchName: "Cabang Utama",
                    createdAt: new Date("2026-04-09T01:00:00.000Z"),
                    estimatedCompletedAt: null,
                    assignedDriverId: null,
                    assignedDriverName: null,
                },
            ]],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders?branchId=br-1&limit=20");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
            id: "ord-1",
            orderNumber: "LDR-009",
            branchName: "Cabang Utama",
        });
    });

    it("[OK] [AC-ORD-02] GET /orders/:id returns detail with items/payments/timeline", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    organizationId: "org-1",
                    branchId: "br-1",
                    orderNumber: "LDR-010",
                    status: "processing",
                }],
                [{
                    id: "item-1",
                    orderId: "ord-1",
                    serviceName: "Cuci Kiloan",
                    quantity: "2.00",
                    lineTotal: 14000,
                    createdAt: new Date("2026-04-09T01:10:00.000Z"),
                }],
                [{
                    id: "pay-1",
                    orderId: "ord-1",
                    amount: 5000,
                    createdAt: new Date("2026-04-09T01:15:00.000Z"),
                }],
                [{
                    id: "hist-1",
                    orderId: "ord-1",
                    fromStatus: "received",
                    toStatus: "processing",
                    createdAt: new Date("2026-04-09T01:20:00.000Z"),
                }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.items).toHaveLength(1);
        expect(body.data.payments).toHaveLength(1);
        expect(body.data.timeline).toHaveLength(1);
    });

    it("[OK] [AC-PAY-01] GET /orders/:id/payments returns payment history rows", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "ord-1", branchId: "br-1" }],
                [
                    { id: "pay-1", orderId: "ord-1", amount: 5000 },
                    { id: "pay-2", orderId: "ord-1", amount: 3000 },
                ],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/payments");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(2);
        expect(body.data[0].id).toBe("pay-1");
    });

    it("[OK] [AC-SSE-01] GET /stream/orders emits SSE retry and order-status event", async () => {
        const createdAt = new Date("2026-04-10T03:00:00.000Z");
        const db = createDbMock({
            selectResults: [[
                {
                    id: "hist-1",
                    orderId: "ord-1",
                    fromStatus: "received",
                    toStatus: "processing",
                    note: "Mulai proses",
                    actorId: "user-1",
                    createdAt,
                    branchId: "br-1",
                },
            ]],
        });
        const app = createLaundryApp(db);
        const controller = new AbortController();

        const res = await app.request("/api/dashboard/laundry/stream/orders", {
            method: "GET",
            signal: controller.signal,
        });

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/event-stream");

        const reader = res.body?.getReader();
        expect(reader).toBeTruthy();
        const decoder = new TextDecoder();
        let payload = "";

        for (let i = 0; i < 6; i += 1) {
            const chunk = await Promise.race([
                reader!.read(),
                new Promise<{ done: true; value?: undefined }>((resolve) => {
                    setTimeout(() => resolve({ done: true }), 100);
                }),
            ]);
            if (chunk.done) break;
            payload += decoder.decode(chunk.value);
            if (payload.includes("event: order-status") && payload.includes("\"orderId\":\"ord-1\"")) {
                break;
            }
        }

        expect(payload).toContain("retry: 2000");
        expect(payload).toContain("event: order-status");
        expect(payload).toContain("\"orderId\":\"ord-1\"");

        controller.abort();
        await reader?.cancel().catch(() => undefined);
    });

    it("GET /orders enforces branch access", async () => {
        getBranchAccessContextMock.mockResolvedValueOnce({ branchIds: ["br-1"], isOrgWide: false });
        const app = createLaundryApp(createDbMock());

        const res = await app.request("/api/dashboard/laundry/orders?branchId=br-2");
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
    });

    it("GET /reports/summary returns aggregate values", async () => {
        const db = createDbMock({
            selectResults: [
                [{ totalRevenue: 120000 }],
                [{
                    totalOrders: 8,
                    completedOrders: 6,
                    cancelledOrders: 1,
                    outstandingAmount: 23000,
                }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/reports/summary");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            totalRevenue: 120000,
            totalOrders: 8,
            completedOrders: 6,
            cancelledOrders: 1,
            outstandingAmount: 23000,
        });
    });

    it("GET /orders/:id/receipt returns thermal payload and wa text", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    organizationId: "org-1",
                    branchId: "br-1",
                    orderNumber: "LDR-20260406-001",
                    status: "processing",
                    customerName: "Budi",
                    customerPhone: "08123",
                    subtotalAmount: 10000,
                    totalAmount: 10000,
                    paidAmount: 4000,
                    remainingAmount: 6000,
                    createdAt: new Date("2026-04-06T02:00:00.000Z"),
                }],
                [{
                    id: "item-1",
                    serviceName: "Cuci Kiloan",
                    quantity: "2.00",
                    unitPrice: 5000,
                    lineTotal: 10000,
                    createdAt: new Date("2026-04-06T02:00:00.000Z"),
                }],
                [{
                    id: "pay-1",
                    amount: 4000,
                    paymentMethod: "cash",
                    createdAt: new Date("2026-04-06T02:10:00.000Z"),
                }],
                [{
                    metadata: null,
                    name: "Laundry Satu",
                }],
            ],
        });
        const app = createLaundryApp(db);

        const res = await app.request("/api/dashboard/laundry/orders/ord-1/receipt");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.thermal.orderNumber).toBe("LDR-20260406-001");
        expect(body.data.thermal.paymentHistory).toHaveLength(1);
        expect(body.data.waMessageText).toContain("LDR-20260406-001");
    });
});
