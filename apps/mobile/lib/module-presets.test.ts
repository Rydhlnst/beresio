import { describe, expect, it } from "vitest";

import { getModuleFlowSpec, getModulePreset } from "./module-presets";

describe("module-presets", () => {
  it("applies laundry override for order module summary", () => {
    const preset = getModulePreset({
      businessType: "laundry",
      moduleId: "order",
      moduleLabel: "Order Cucian",
    });

    expect(preset.title).toBe("Order Operations");
    expect(preset.summary).toContain("intake");
    expect(preset.primaryActionLabel).toBe("Buka Antrian Order");
  });

  it("returns generic fallback preset for unknown module", () => {
    const preset = getModulePreset({
      businessType: "laundry",
      moduleId: "unknown-module",
      moduleLabel: "Unknown",
    });

    expect(preset.title).toBe("Unknown Workspace");
    expect(preset.checklist).toHaveLength(3);
    expect(preset.primaryActionLabel).toBe("Buka Workspace");
  });

  it("builds primary and secondary flow specs", () => {
    const primary = getModuleFlowSpec({
      businessType: "laundry",
      moduleId: "order",
      moduleLabel: "Order Cucian",
      actionType: "primary",
    });
    expect(primary.title).toContain("Buka Antrian Order");
    expect(primary.successMetric).toContain("Aksi utama");

    const secondary = getModuleFlowSpec({
      businessType: "laundry",
      moduleId: "order",
      moduleLabel: "Order Cucian",
      actionType: "secondary",
    });
    expect(secondary.title).toContain("Tambah Order");
    expect(secondary.successMetric).toContain("Aksi lanjutan");
  });
});
