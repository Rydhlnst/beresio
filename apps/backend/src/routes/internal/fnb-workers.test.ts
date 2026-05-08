import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "../dashboard/test-utils";

const { runFnbProjectorUntilCaughtUpMock } = vi.hoisted(() => ({
    runFnbProjectorUntilCaughtUpMock: vi.fn(async (_db: any, input: any) => ({
        projectorName: input.projectorName ?? "fnb-core-projector",
        totalProcessed: input.organizationId === "org-1" ? 2 : 1,
        lastSequence: input.organizationId === "org-1" ? 10 : 7,
        batches: 1,
    })),
}));

vi.mock("../../lib/fnb-domain", () => ({
    runFnbProjectorUntilCaughtUp: runFnbProjectorUntilCaughtUpMock,
}));

import { internalFnbWorkersRouter } from "./fnb-workers";

const createApp = (db: any) => createTestApp(internalFnbWorkersRouter, "/api/internal/fnb", db);
const env = { INTERNAL_API_SECRET: "internal-secret" } as any;

describe("internal fnb workers route", () => {
    it("rejects request without internal key", async () => {
        const app = createApp(createDbMock());
        const res = await app.request("/api/internal/fnb/projectors/catch-up", { method: "POST" }, env);
        expect(res.status).toBe(401);
    });

    it("runs catch-up for explicit organization", async () => {
        runFnbProjectorUntilCaughtUpMock.mockClear();
        const app = createApp(createDbMock());

        const res = await app.request("/api/internal/fnb/projectors/catch-up", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-internal-api-key": "internal-secret",
            },
            body: JSON.stringify({ organizationId: "org-1", batchSize: 50 }),
        }, env);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.organizationsProcessed).toBe(1);
        expect(body.data.organizationIds).toEqual(["org-1"]);
        expect(runFnbProjectorUntilCaughtUpMock).toHaveBeenCalledTimes(1);
    });

    it("auto-discovers organizations and deduplicates for scheduler run", async () => {
        runFnbProjectorUntilCaughtUpMock.mockClear();
        const db = createDbMock({
            selectResults: [[
                { organizationId: "org-1" },
                { organizationId: "org-2" },
                { organizationId: "org-1" },
            ]],
        });
        const app = createApp(db);

        const res = await app.request("/api/internal/fnb/projectors/catch-up?maxOrganizations=2", {
            method: "GET",
            headers: { "x-internal-api-key": "internal-secret" },
        }, env);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.organizationIds).toEqual(["org-1", "org-2"]);
        expect(body.data.organizationsProcessed).toBe(2);
        expect(runFnbProjectorUntilCaughtUpMock).toHaveBeenCalledTimes(2);
    });
});
