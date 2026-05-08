import { describe, expect, it } from "vitest";
import {
    normalizeOrderStatusInput,
    normalizeOrderTypeInput,
} from "@beresio/db";

describe("order contract normalizers", () => {
    it("normalizes legacy status into canonical status", () => {
        expect(normalizeOrderStatusInput("received")).toBe("pending");
        expect(normalizeOrderStatusInput("in_process")).toBe("processing");
        expect(normalizeOrderStatusInput("done")).toBe("processing");
        expect(normalizeOrderStatusInput("ready_pickup")).toBe("processing");
        expect(normalizeOrderStatusInput("out_for_delivery")).toBe("processing");
    });

    it("keeps canonical and extended status as-is", () => {
        expect(normalizeOrderStatusInput("pending")).toBe("pending");
        expect(normalizeOrderStatusInput("processing")).toBe("processing");
        expect(normalizeOrderStatusInput("completed")).toBe("completed");
        expect(normalizeOrderStatusInput("cancelled")).toBe("cancelled");
        expect(normalizeOrderStatusInput("served")).toBe("served");
    });

    it("normalizes legacy type into canonical type", () => {
        expect(normalizeOrderTypeInput("walkin")).toBe("walk_in");
        expect(normalizeOrderTypeInput("pickup_delivery")).toBe("pickup");
    });

    it("keeps canonical and extended type as-is", () => {
        expect(normalizeOrderTypeInput("walk_in")).toBe("walk_in");
        expect(normalizeOrderTypeInput("pickup")).toBe("pickup");
        expect(normalizeOrderTypeInput("delivery")).toBe("delivery");
        expect(normalizeOrderTypeInput("dine_in")).toBe("dine_in");
    });
});
