import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assignLaundryOrderDriver,
  fetchLaundryDrivers,
  fetchRecentLaundryOrders,
  recordLaundryPayment,
  updateLaundryOrderStatus,
} from "./laundry-flow-actions";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("laundry-flow-actions", () => {
  it("fetches recent laundry orders", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "ord-1",
              orderNumber: "LDR-001",
              status: "received",
              customerName: "Budi",
              remainingAmount: 15000,
              assignedDriverId: null,
              assignedDriverName: null,
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const rows = await fetchRecentLaundryOrders(5);
    expect(rows).toEqual([
      {
        id: "ord-1",
        orderNumber: "LDR-001",
        status: "received",
        customerName: "Budi",
        remainingAmount: 15000,
        assignedDriverId: null,
        assignedDriverName: null,
      },
    ]);
  });

  it("fetches only active drivers for dropdown", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { id: "mem-1", name: "Rizky Driver", email: "d1@beres.id", role: "driver", status: "active" },
            { id: "mem-2", name: "Owner", email: "owner@beres.id", role: "owner", status: "active" },
            { id: "mem-3", name: "Driver Inactive", email: "d2@beres.id", role: "driver", status: "inactive" },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const drivers = await fetchLaundryDrivers();
    expect(drivers).toEqual([
      {
        id: "mem-1",
        name: "Rizky Driver",
        email: "d1@beres.id",
        role: "driver",
      },
    ]);
  });

  it("updates laundry order status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "ord-1",
            status: "processing",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const data = await updateLaundryOrderStatus({
      orderId: "ord-1",
      status: "processing",
      note: "Mulai proses",
    });
    expect(data.status).toBe("processing");
  });

  it("records laundry payment", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            payment: { id: "pay-1", amount: 5000 },
            order: { id: "ord-1", remainingAmount: 10000, paymentStatus: "partial" },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const data = await recordLaundryPayment({
      orderId: "ord-1",
      amount: 5000,
      paymentMethod: "cash",
      note: "Bayar DP",
    });

    expect(data.payment.id).toBe("pay-1");
    expect(data.order.paymentStatus).toBe("partial");
  });

  it("throws backend message when api fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { message: "Overpayment is not allowed" },
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      )
    ) as any;

    await expect(
      recordLaundryPayment({
        orderId: "ord-1",
        amount: 999999,
      })
    ).rejects.toThrow("Overpayment is not allowed");
  });

  it("assigns driver to laundry order", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "ord-1",
            assignedDriverId: "driver-1",
            assignedDriverName: "Rizky Driver",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const data = await assignLaundryOrderDriver({
      orderId: "ord-1",
      driverId: "driver-1",
    });

    expect(data.assignedDriverId).toBe("driver-1");
  });
});
