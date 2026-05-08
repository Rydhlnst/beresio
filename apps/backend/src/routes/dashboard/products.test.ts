import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

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

import { productsRouter } from "./products";
const createProductsApp = (db: any) =>
    createTestApp(productsRouter, "/api/dashboard/products", db);

describe("products routes", () => {
    describe("GET /", () => {
        it("returns product list with pagination", async () => {
            const db = createDbMock({
                selectResults: [
                    // Count query
                    [{ count: 2 }],
                    // Products query
                    [
                        {
                            id: "prod-1",
                            name: "Test Product",
                            sku: "TEST-001",
                            barcode: "123456789",
                            basePrice: 10000,
                            salePrice: 9000,
                            costPrice: 7000,
                            imageUrl: "https://example.com/image.jpg",
                            isActive: true,
                            isFeatured: false,
                            soldCount: 100,
                            inventoryProductId: "inv-1",
                            categoryId: "cat-1",
                            supplierId: "sup-1",
                            createdAt: new Date().toISOString(),
                            categoryName: "Electronics",
                            supplierName: "Test Supplier",
                        },
                    ],
                    // Stock query
                    [
                        { productId: "inv-1", quantity: 50 },
                    ],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products?page=1&limit=10");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.data).toHaveLength(1);
            expect(body.data.data[0]).toMatchObject({
                id: "prod-1",
                name: "Test Product",
                pricing: {
                    basePrice: 10000,
                    salePrice: 9000,
                    costPrice: 7000,
                },
                stock: {
                    quantity: 50,
                    status: "ok",
                },
            });
            expect(body.data.meta).toMatchObject({
                total: 2,
                page: 1,
                limit: 10,
            });
        });

        it("filters by search query", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ count: 1 }],
                    [
                        {
                            id: "prod-1",
                            name: "iPhone 14",
                            sku: "IPH-001",
                            barcode: "123456",
                            basePrice: 15000000,
                            salePrice: 14000000,
                            costPrice: 13000000,
                            imageUrl: null,
                            isActive: true,
                            isFeatured: true,
                            soldCount: 50,
                            inventoryProductId: null,
                            categoryId: null,
                            supplierId: null,
                            createdAt: new Date().toISOString(),
                            categoryName: null,
                            supplierName: null,
                        },
                    ],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products?search=iphone");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.data[0].name).toBe("iPhone 14");
        });

        it("filters by stock status", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ count: 1 }],
                    [
                        {
                            id: "prod-1",
                            name: "Low Stock Item",
                            sku: "LOW-001",
                            barcode: null,
                            basePrice: 50000,
                            salePrice: null,
                            costPrice: 40000,
                            imageUrl: null,
                            isActive: true,
                            isFeatured: false,
                            soldCount: 10,
                            inventoryProductId: "inv-1",
                            categoryId: null,
                            supplierId: null,
                            createdAt: new Date().toISOString(),
                            categoryName: null,
                            supplierName: null,
                        },
                    ],
                    [{ productId: "inv-1", quantity: 5 }],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products?stockStatus=low");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.data.data[0].stock.status).toBe("low");
        });

        it("returns empty array when no products", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ count: 0 }],
                    [],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.data).toHaveLength(0);
            expect(body.data.meta.total).toBe(0);
        });
    });

    describe("GET /:id", () => {
        it("returns product detail", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        {
                            id: "prod-1",
                            name: "Detailed Product",
                            sku: "DET-001",
                            barcode: "987654321",
                            basePrice: 200000,
                            salePrice: 180000,
                            costPrice: 150000,
                            description: "Product description",
                            shortDescription: "Short desc",
                            weight: 500,
                            dimensions: { length: 10, width: 5, height: 3 },
                            imageUrl: "https://example.com/image.jpg",
                            images: ["https://example.com/img1.jpg"],
                            isActive: true,
                            isFeatured: false,
                            soldCount: 200,
                            metaTitle: "Meta Title",
                            metaDescription: "Meta Description",
                            inventoryProductId: "inv-1",
                            categoryId: "cat-1",
                            supplierId: "sup-1",
                            slug: "detailed-product",
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            categoryName: "Category",
                            supplierName: "Supplier",
                        },
                    ],
                    [
                        { branchId: "br-1", branchName: "Main Branch", quantity: 100 },
                        { branchId: "br-2", branchName: "Second Branch", quantity: 50 },
                    ],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/prod-1");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toMatchObject({
                id: "prod-1",
                name: "Detailed Product",
                pricing: {
                    basePrice: 200000,
                    salePrice: 180000,
                    costPrice: 150000,
                },
                stock: {
                    totalQuantity: 150,
                    byBranch: [
                        { branchId: "br-1", branchName: "Main Branch", quantity: 100 },
                        { branchId: "br-2", branchName: "Second Branch", quantity: 50 },
                    ],
                },
            });
        });

        it("returns 404 for non-existent product", async () => {
            const db = createDbMock({
                selectResults: [[]],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/non-existent");
            const body = (await res.json()) as any;

            expect(res.status).toBe(404);
            expect(body.success).toBe(false);
        });
    });

    describe("POST /", () => {
        it("creates new product successfully", async () => {
            const newProduct = {
                id: "new-prod-1",
                name: "New Product",
                sku: "NEW-001",
                barcode: "111222333",
                categoryId: "cat-1",
                supplierId: "sup-1",
                basePrice: 50000,
                salePrice: 45000,
                costPrice: 35000,
                description: "Description",
                isActive: true,
                isFeatured: false,
                createdAt: new Date().toISOString(),
            };

            const db = createDbMock({
                selectResults: [
                    [], // No existing SKU
                    [], // No existing barcode
                ],
                insertResults: [
                    [newProduct],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "New Product",
                    sku: "NEW-001",
                    barcode: "111222333",
                    basePrice: 50000,
                    salePrice: 45000,
                    costPrice: 35000,
                    description: "Description",
                }),
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.name).toBe("New Product");
        });

        it("rejects duplicate SKU", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ id: "existing-prod" }], // Existing SKU found
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Duplicate Product",
                    sku: "DUPLICATE-001",
                    basePrice: 10000,
                }),
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.message).toContain("SKU sudah digunakan");
        });

        it("rejects missing name", async () => {
            const db = createDbMock({});
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku: "NO-NAME-001",
                    basePrice: 10000,
                }),
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
        });
    });

    describe("PATCH /:id", () => {
        it("updates product successfully", async () => {
            const updatedProduct = {
                id: "prod-1",
                name: "Updated Name",
                sku: "UPD-001",
                barcode: "999888777",
                categoryId: null,
                supplierId: null,
                basePrice: 75000,
                salePrice: null,
                costPrice: null,
                isActive: true,
                isFeatured: true,
                updatedAt: new Date().toISOString(),
            };

            const db = createDbMock({
                selectResults: [
                    [{ id: "prod-1", sku: "OLD-001", barcode: "123" }], // Existing product
                    [], // No duplicate SKU
                    [], // No duplicate barcode
                ],
                updateResults: [
                    [updatedProduct],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/prod-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Updated Name",
                    sku: "UPD-001",
                    basePrice: 75000,
                    isFeatured: true,
                }),
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.name).toBe("Updated Name");
            expect(body.data.isFeatured).toBe(true);
        });

        it("returns 404 for non-existent product", async () => {
            const db = createDbMock({
                selectResults: [[]],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/non-existent", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "New Name" }),
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(404);
            expect(body.success).toBe(false);
        });

        it("phase 2.6: rejects empty update payload", async () => {
            const app = createProductsApp(createDbMock());

            const res = await app.request("/api/dashboard/products/prod-1", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe("BAD_REQUEST");
        });
    });

    describe("DELETE /:id", () => {
        it("deletes product successfully", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ id: "prod-1" }], // Product exists
                ],
                deleteResults: [
                    [], // Delete result
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/prod-1", {
                method: "DELETE",
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.deleted).toBe(true);
        });

        it("returns 404 for non-existent product", async () => {
            const db = createDbMock({
                selectResults: [[]],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/non-existent", {
                method: "DELETE",
            });
            const body = (await res.json()) as any;

            expect(res.status).toBe(404);
            expect(body.success).toBe(false);
        });
    });

    describe("GET /categories", () => {
        it("returns categories list", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        { id: "cat-1", name: "Electronics", slug: "electronics", isActive: true },
                        { id: "cat-2", name: "Fashion", slug: "fashion", isActive: true },
                    ],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/categories");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.data).toHaveLength(2);
            expect(body.data.data[0].name).toBe("Electronics");
        });
    });

    describe("GET /suppliers", () => {
        it("returns suppliers list", async () => {
            const db = createDbMock({
                selectResults: [
                    [
                        { id: "sup-1", name: "Supplier A", code: "SUP-A", isActive: true },
                        { id: "sup-2", name: "Supplier B", code: "SUP-B", isActive: true },
                    ],
                ],
            });
            const app = createProductsApp(db);

            const res = await app.request("/api/dashboard/products/suppliers");
            const body = (await res.json()) as any;

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.data).toHaveLength(2);
        });
    });

    it("phase 2.6: GET / hides internal error details", async () => {
        const app = createProductsApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/products");
        const body = (await res.json()) as any;

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});

