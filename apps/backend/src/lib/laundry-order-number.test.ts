import { describe, expect, it } from "vitest";
import { generateLaundryOrderNumber } from "./laundry-order-number";
import {
    canTransitionLaundryOrderStatus,
    type LaundryOrderStatus,
} from "@beresio/db";

describe("laundry order contracts", () => {
    it("generates LDR-YYYYMMDD-XXX number format", async () => {
        const db = {
            execute: async () => ({ rows: [{ last_number: 7 }] }),
        };

        const value = await generateLaundryOrderNumber(db, {
            organizationId: "org-1",
            branchId: "00000000-0000-0000-0000-000000000001",
            now: new Date("2026-04-06T10:10:10.000Z"),
        });

        expect(value).toBe("LDR-20260406-007");
    });

    it("resets sequence for a new branch-day counter row", async () => {
        const db = {
            execute: async () => ({ rows: [{ last_number: 1 }] }),
        };

        const value = await generateLaundryOrderNumber(db, {
            organizationId: "org-1",
            branchId: "00000000-0000-0000-0000-000000000002",
            now: new Date("2026-04-07T00:01:00.000Z"),
        });

        expect(value).toBe("LDR-20260407-001");
    });

    it("rejects invalid transition", () => {
        const fromStatus: LaundryOrderStatus = "received";
        const toStatus: LaundryOrderStatus = "completed";
        expect(canTransitionLaundryOrderStatus(fromStatus, toStatus)).toBe(false);
    });

    it("allows valid transition", () => {
        const fromStatus: LaundryOrderStatus = "processing";
        const toStatus: LaundryOrderStatus = "ready_for_pickup";
        expect(canTransitionLaundryOrderStatus(fromStatus, toStatus)).toBe(true);
    });
});
