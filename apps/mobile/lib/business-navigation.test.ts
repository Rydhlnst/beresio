import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchBusinessNavigation,
  isBusinessType,
  normalizeBusinessType,
  pickActiveOrganization,
  pickPrimaryModule,
  type BusinessNavResponse,
  type OrganizationSummary,
} from "./business-navigation";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("business-navigation", () => {
  it("normalizes supported and aliased business types", () => {
    expect(normalizeBusinessType("laundry")).toBe("laundry");
    expect(normalizeBusinessType("caffe")).toBe("fnb");
    expect(normalizeBusinessType("other")).toBe("retail");
    expect(normalizeBusinessType("unknown")).toBe("retail");
    expect(normalizeBusinessType(undefined)).toBe("retail");
  });

  it("validates known business types", () => {
    expect(isBusinessType("laundry")).toBe(true);
    expect(isBusinessType("fnb")).toBe(true);
    expect(isBusinessType("retail")).toBe(true);
    expect(isBusinessType("caffe")).toBe(false);
    expect(isBusinessType(undefined)).toBe(false);
  });

  it("picks active organization with fallback", () => {
    const organizations: OrganizationSummary[] = [
      { id: "org-1", name: "Org 1", businessType: "laundry" },
      { id: "org-2", name: "Org 2", businessType: "retail" },
    ];

    expect(pickActiveOrganization(organizations, "org-2")?.id).toBe("org-2");
    expect(pickActiveOrganization(organizations, "org-missing")?.id).toBe("org-1");
    expect(pickActiveOrganization(organizations, null)?.id).toBe("org-1");
    expect(pickActiveOrganization([], "org-1")).toBeNull();
  });

  it("picks primary module from vertical first, then navigation fallback", () => {
    const navFromVertical: BusinessNavResponse = {
      business: { id: "org-1", name: "Laundry", type: "laundry", config: {} },
      navigationBase: [{ id: "dashboard", label: "Dashboard", icon: "x", path: "/dashboard" }],
      navigationVertical: [{ id: "order", label: "Order", icon: "x", path: "/laundry/orders" }],
      navigation: [{ id: "laporan", label: "Laporan", icon: "x", path: "/laundry/reports" }],
      permissions: [],
    };
    expect(pickPrimaryModule(navFromVertical)?.id).toBe("order");

    const navFallback: BusinessNavResponse = {
      business: { id: "org-1", name: "Laundry", type: "laundry", config: {} },
      navigationBase: [],
      navigationVertical: [],
      navigation: [{ id: "dashboard", label: "Dashboard", icon: "x", path: "/dashboard" }],
      permissions: [],
    };
    expect(pickPrimaryModule(navFallback)?.id).toBe("dashboard");
    expect(pickPrimaryModule(null)).toBeNull();
  });

  it("fetches business navigation successfully", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            business: { id: "org-1", name: "Laundry", type: "laundry", config: {} },
            navigationBase: [],
            navigationVertical: [{ id: "order", label: "Order", icon: "x", path: "/laundry/orders" }],
            navigation: [{ id: "order", label: "Order", icon: "x", path: "/laundry/orders" }],
            permissions: [],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const result = await fetchBusinessNavigation("org-1");

    expect(result.status).toBe(200);
    expect(result.errorMessage).toBeNull();
    expect(result.data?.business.type).toBe("laundry");
  });

  it("returns error message when backend responds with failure body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "No access" } }),
        { status: 403, headers: { "content-type": "application/json" } }
      )
    ) as any;

    const result = await fetchBusinessNavigation("org-1");
    expect(result.data).toBeNull();
    expect(result.status).toBe(403);
    expect(result.errorMessage).toContain("No access");
  });
});
