import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
}));

import { pickupRouter } from "./pickup";

const createPickupApp = (db: any) => createTestApp(pickupRouter, "/api/dashboard/pickup", db);

describe("pickup routes deprecation", () => {
    it("GET / returns 410 with replacement metadata", async () => {
        const app = createPickupApp(createDbMock());

        const res = await app.request("/api/dashboard/pickup");
        const body = await res.json();

        expect(res.status).toBe(410);
        expect(res.headers.get("x-deprecated")).toBe("true");
        expect(res.headers.get("sunset")).toBeTruthy();
        expect(body.success).toBe(false);
        expect(body.code).toBe("LEGACY_PICKUP_DEPRECATED");
        expect(body.replacement).toMatchObject({
            path: "/api/dashboard/laundry/orders",
            query: { orderType: "pickup" },
        });
    });

    it("PATCH /:id/status also returns 410 for hard deprecation", async () => {
        const app = createPickupApp(createDbMock());

        const res = await app.request("/api/dashboard/pickup/ord-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "Dikonfirmasi" }),
        });
        const body = await res.json();

        expect(res.status).toBe(410);
        expect(body.code).toBe("LEGACY_PICKUP_DEPRECATED");
        expect(body.replacement.path).toBe("/api/dashboard/laundry/orders");
    });

    it("[OK] [AC-DEPRECATION-ROLLBACK-01] allows legacy route when feature flag enabled", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createPickupApp(db);

        const res = await app.request(
            "/api/dashboard/pickup",
            undefined,
            { ENABLE_LEGACY_PICKUP_ROUTES: "true" } as any
        );
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toEqual([]);
    });
});
