import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp, readJson } from "./test-utils";

// Mock auth middleware
vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
    getUserId: vi.fn(async () => "user-1"),
}));

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: vi.fn(async () => ({
        branchIds: ["br-1", "br-2"],
        isOrgWide: false,
    })),
    getAccessibleBranchIds: vi.fn(async () => ["br-1", "br-2"]),
    hasBranchAccess: (branchIds: string[], branchId?: string | null) =>
        Boolean(branchId && branchIds.includes(branchId)),
}));

import { inventoryRouter } from "./inventory";
const createInventoryApp = (db: any) =>
    createTestApp(inventoryRouter, "/api/dashboard/inventory", db);

describe("inventory routes", () => {
    describe("GET /products", () => {
        it("returns inventory products list", async () => {
            const db = createDbMock({
                selectResults: [
                    // Products query
                    [
                        {
                            id: "inv-prod-1",
                            name: "Indomie Goreng",
                            sku: "IND-001",
                            unit: "pcs",
                            isActive: true,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    // Stocks query
                    [
                        {
                            productId: "inv-prod-1",
                            branchId: "br-1",
                            branchName: "Jakarta",
                            quantity: 100,
                        },
                        {
                            productId: "inv-prod-1",
                            branchId: "br-2",
                            branchName: "Bandung",
                            quantity: 50,
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/products");
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data[0]).toMatchObject({
                id: "inv-prod-1",
                name: "Indomie Goreng",
                stocks: [
                    { branchId: "br-1", branchName: "Jakarta", quantity: 100 },
                    { branchId: "br-2", branchName: "Bandung", quantity: 50 },
                ],
            });
        });

        it("filters by search query", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        {
                            id: "inv-prod-1",
                            name: "Indomie Goreng",
                            sku: "IND-001",
                            unit: "pcs",
                            isActive: true,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    [],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/products?search=indomie");
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.data[0].name).toBe("Indomie Goreng");
        });

        it("filters by branch", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        {
                            id: "inv-prod-1",
                            name: "Product 1",
                            sku: "SKU-001",
                            unit: "pcs",
                            isActive: true,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    [
                        {
                            productId: "inv-prod-1",
                            branchId: "br-1",
                            branchName: "Jakarta",
                            quantity: 100,
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/products?branchId=br-1");
            expect(res.status).toBe(200);
        });
    });

    describe("POST /products", () => {
        it("creates new inventory product", async () => {
            const db = createDbMock({
                selectResults: [
                    [], // No existing SKU
                ],
                insertResults: [
                    [
                        {
                            id: "new-prod-1",
                            name: "New Product",
                            sku: "NEW-001",
                            unit: "pcs",
                            isActive: true,
                            createdAt: new Date().toISOString(),
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "New Product",
                    sku: "NEW-001",
                    unit: "pcs",
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.name).toBe("New Product");
        });

        it("rejects duplicate SKU", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ id: "existing-prod" }],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Duplicate",
                    sku: "EXISTING-001",
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(400);
            expect(body.error.message).toContain("SKU already exists");
        });

        it("rejects missing name", async () => {
            const db = createDbMock({});
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku: "NO-NAME",
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(400);
        });
    });

    describe("GET /adjustments", () => {
        it("returns adjustment history", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        {
                            id: "adj-1",
                            productId: "prod-1",
                            productName: "Indomie",
                            branchId: "br-1",
                            branchName: "Jakarta",
                            quantityDelta: 50,
                            reason: "Stock opname",
                            actorId: "user-1",
                            actorName: "Admin",
                            createdAt: new Date().toISOString(),
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/adjustments");
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data[0]).toMatchObject({
                quantityDelta: 50,
                reason: "Stock opname",
            });
        });
    });

    describe("POST /adjustments", () => {
        it("creates stock adjustment", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ id: "prod-1" }], // Product exists
                    [{ id: "br-1" }], // Branch exists
                    [{ id: "stock-1", quantity: 100 }], // Existing stock
                ],
                insertResults: [
                    [
                        {
                            id: "adj-1",
                            productId: "prod-1",
                            branchId: "br-1",
                            quantityDelta: 50,
                            reason: "Restock",
                            actorId: "user-1",
                            createdAt: new Date().toISOString(),
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/adjustments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: "prod-1",
                    branchId: "br-1",
                    quantityDelta: 50,
                    reason: "Restock",
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
        });

        it("rejects insufficient stock for negative adjustment", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ id: "prod-1" }],
                    [{ id: "br-1" }],
                    [{ id: "stock-1", quantity: 10 }],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/adjustments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: "prod-1",
                    branchId: "br-1",
                    quantityDelta: -100, // More than available
                    reason: "Damaged",
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(400);
            expect(body.error.message).toContain("Stok tidak mencukupi");
        });
    });

    describe("GET /transfers", () => {
        it("returns transfer list", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        {
                            id: "xfer-1",
                            productId: "prod-1",
                            productName: "Indomie",
                            fromBranchId: "br-1",
                            fromBranchName: "Jakarta",
                            toBranchId: "br-2",
                            toBranchName: "Bandung",
                            quantity: 50,
                            status: "pending",
                            note: "Stock transfer",
                            createdAt: new Date().toISOString(),
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/transfers");
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data[0].status).toBe("pending");
        });
    });

    describe("POST /transfers", () => {
        it("creates transfer request", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ id: "prod-1" }], // Product
                    [{ id: "br-1" }], // From branch
                    [{ id: "br-2" }], // To branch
                    [{ quantity: 100 }], // Stock available
                ],
                insertResults: [
                    [
                        {
                            id: "xfer-1",
                            productId: "prod-1",
                            fromBranchId: "br-1",
                            toBranchId: "br-2",
                            quantity: 50,
                            status: "pending",
                            createdAt: new Date().toISOString(),
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/transfers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: "prod-1",
                    fromBranchId: "br-1",
                    toBranchId: "br-2",
                    quantity: 50,
                    note: "Restock cabang",
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.status).toBe("pending");
        });

        it("rejects transfer to same branch", async () => {
            const db = createDbMock({});
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/transfers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: "prod-1",
                    fromBranchId: "br-1",
                    toBranchId: "br-1", // Same branch
                    quantity: 50,
                }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(400);
            expect(body.error.message).toContain("must differ");
        });
    });

    describe("PATCH /transfers/:id", () => {
        it("approves transfer and updates stock", async () => {
            const db = createDbMock({
                selectResults: [
                    [{
                        id: "xfer-1",
                        productId: "prod-1",
                        fromBranchId: "br-1",
                        toBranchId: "br-2",
                        quantity: 50,
                        status: "pending",
                    }],
                    [{ id: "stock-1", quantity: 100 }], // From branch stock
                    [{ id: "stock-2", quantity: 20 }], // To branch stock
                ],
                updateResults: [
                    [],
                    [],
                    [
                        {
                            id: "xfer-1",
                            status: "approved",
                            decidedBy: "user-1",
                            decidedAt: new Date().toISOString(),
                        },
                    ],
                ],
            });
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/transfers/xfer-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "approved" }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.status).toBe("approved");
        });

        it("rejects invalid status", async () => {
            const db = createDbMock({});
            const app = createInventoryApp(db);

            const res = await app.request("/api/dashboard/inventory/transfers/xfer-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "invalid-status" }),
            });
            const body = await readJson<any>(res);

            expect(res.status).toBe(400);
        });
    });
});
