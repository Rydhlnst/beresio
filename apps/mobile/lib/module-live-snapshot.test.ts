import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchModuleLiveSnapshot } from "./module-live-snapshot";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("module-live-snapshot", () => {
  it("uses laundry summary endpoint for laundry dashboard", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            totalRevenue: 120000,
            totalOrders: 8,
            completedOrders: 6,
            cancelledOrders: 1,
            outstandingAmount: 23000,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const result = await fetchModuleLiveSnapshot({
      businessType: "laundry",
      moduleId: "dashboard",
    });

    expect(result.endpoint).toBe("/api/dashboard/laundry/reports/summary");
    expect(result.rows).toEqual([
      { label: "Omzet Hari Ini", value: "Rp 120.000" },
      { label: "Total Order", value: "8" },
      { label: "Order Selesai", value: "6" },
      { label: "Outstanding", value: "Rp 23.000" },
    ]);
  });

  it("summarizes laporan and derives cancellation rate if missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            totalRevenue: 200000,
            totalOrders: 4,
            completedOrders: 3,
            cancelledOrders: 1,
            outstandingAmount: 50000,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const result = await fetchModuleLiveSnapshot({
      businessType: "laundry",
      moduleId: "laporan",
    });

    expect(result.endpoint).toBe("/api/dashboard/laundry/reports/summary");
    expect(result.rows).toEqual([
      { label: "Revenue Total", value: "Rp 200.000" },
      { label: "Completed Orders", value: "3" },
      { label: "Cancellation Rate", value: "25%" },
      { label: "Outstanding", value: "Rp 50.000" },
    ]);
  });

  it("uses laundry orders endpoint for order module", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ id: "ord-1", orderNumber: "LDR-001", status: "received" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const result = await fetchModuleLiveSnapshot({
      businessType: "laundry",
      moduleId: "order",
    });

    expect(result.endpoint).toBe("/api/dashboard/laundry/orders?limit=5");
    expect(result.rows[0]).toEqual({ label: "Total Records", value: "1" });
  });

  it("throws backend error message for non-2xx responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "No access to branch" } }),
        { status: 403, headers: { "content-type": "application/json" } }
      )
    ) as any;

    await expect(
      fetchModuleLiveSnapshot({
        businessType: "laundry",
        moduleId: "pickup",
      })
    ).rejects.toThrow("No access to branch");
  });
});
