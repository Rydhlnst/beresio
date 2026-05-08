import { describe, expect, it } from "vitest";
import { createDbMock } from "../routes/dashboard/test-utils";
import { canTransitionOrderStatus, runFnbProjectorBatch, runFnbProjectorUntilCaughtUp } from "./fnb-domain";

describe("fnb domain transition matrix", () => {
    it("allows valid transitions", () => {
        expect(canTransitionOrderStatus("pending", "confirmed")).toBe(true);
        expect(canTransitionOrderStatus("confirmed", "preparing")).toBe(true);
        expect(canTransitionOrderStatus("preparing", "ready")).toBe(true);
        expect(canTransitionOrderStatus("ready", "completed")).toBe(true);
    });

    it("blocks invalid transitions", () => {
        expect(canTransitionOrderStatus("pending", "ready")).toBe(false);
        expect(canTransitionOrderStatus("confirmed", "completed")).toBe(false);
        expect(canTransitionOrderStatus("completed", "pending")).toBe(false);
        expect(canTransitionOrderStatus("cancelled", "ready")).toBe(false);
    });

    it("replays projector batch from checkpoint", async () => {
        const db = createDbMock({
            selectResults: [
                [{ lastSequence: 1 }],
                [{
                    id: "evt-2",
                    sequence: 2,
                    organizationId: "org-1",
                    branchId: "br-1",
                    aggregateType: "order",
                    aggregateId: "ord-1",
                    eventType: "UNKNOWN_EVENT",
                    occurredAt: new Date(),
                    actorId: null,
                    idempotencyKey: null,
                    payload: {},
                }, {
                    id: "evt-3",
                    sequence: 3,
                    organizationId: "org-1",
                    branchId: "br-1",
                    aggregateType: "order",
                    aggregateId: "ord-2",
                    eventType: "UNKNOWN_EVENT",
                    occurredAt: new Date(),
                    actorId: null,
                    idempotencyKey: null,
                    payload: {},
                }],
            ],
            insertResults: [[], []],
        });

        const result = await runFnbProjectorBatch(db, { organizationId: "org-1", batchSize: 100 });
        expect(result.processedCount).toBe(2);
        expect(result.lastSequence).toBe(3);
    });

    it("replays projector until caught up in multiple batches", async () => {
        const db = createDbMock({
            selectResults: [
                [{ lastSequence: 0 }],
                [{
                    id: "evt-1",
                    sequence: 1,
                    organizationId: "org-1",
                    branchId: "br-1",
                    aggregateType: "order",
                    aggregateId: "ord-1",
                    eventType: "UNKNOWN_EVENT",
                    occurredAt: new Date(),
                    actorId: null,
                    idempotencyKey: null,
                    payload: {},
                }, {
                    id: "evt-2",
                    sequence: 2,
                    organizationId: "org-1",
                    branchId: "br-1",
                    aggregateType: "order",
                    aggregateId: "ord-2",
                    eventType: "UNKNOWN_EVENT",
                    occurredAt: new Date(),
                    actorId: null,
                    idempotencyKey: null,
                    payload: {},
                }],
                [{ lastSequence: 2 }],
                [{
                    id: "evt-3",
                    sequence: 3,
                    organizationId: "org-1",
                    branchId: "br-1",
                    aggregateType: "order",
                    aggregateId: "ord-3",
                    eventType: "UNKNOWN_EVENT",
                    occurredAt: new Date(),
                    actorId: null,
                    idempotencyKey: null,
                    payload: {},
                }],
            ],
            insertResults: [[], [], []],
        });

        const result = await runFnbProjectorUntilCaughtUp(db, {
            organizationId: "org-1",
            batchSize: 2,
            maxBatches: 5,
        });

        expect(result.totalProcessed).toBe(3);
        expect(result.lastSequence).toBe(3);
        expect(result.batches).toBe(2);
    });
});
