import type { BusinessType } from "@/lib/business-navigation";

export type ModulePreset = {
  title: string;
  summary: string;
  checklist: string[];
  primaryActionLabel: string;
  secondaryActionLabel?: string;
};

export type FlowActionType = "primary" | "secondary";

export type ModuleFlowSpec = {
  title: string;
  description: string;
  steps: string[];
  successMetric: string;
};

type ModulePresetInput = {
  businessType: BusinessType;
  moduleId: string;
  moduleLabel?: string | null;
};

const GENERIC_MODULE_PRESETS: Record<string, ModulePreset> = {
  dashboard: {
    title: "Dashboard Snapshot",
    summary: "Lihat ringkasan performa harian sebelum masuk ke operasi detail.",
    checklist: ["Pantau revenue trend", "Cek alert prioritas", "Review KPI tim"],
    primaryActionLabel: "Buka Ringkasan KPI",
    secondaryActionLabel: "Lihat Alert",
  },
  crm: {
    title: "Customer Hub",
    summary: "Kelola data pelanggan, segmentasi, dan follow-up untuk retention.",
    checklist: ["Cek pelanggan aktif", "Review tags/segment", "Prioritaskan follow-up"],
    primaryActionLabel: "Buka Daftar Pelanggan",
    secondaryActionLabel: "Kelola Segment",
  },
  order: {
    title: "Order Operations",
    summary: "Pantau antrean order dan proses order baru secara realtime.",
    checklist: ["Cek order menunggu", "Buat order baru", "Pastikan status update"],
    primaryActionLabel: "Buka Antrian Order",
    secondaryActionLabel: "Tambah Order",
  },
  inventory: {
    title: "Inventory Control",
    summary: "Kontrol stok kritikal dan optimalkan replenishment lebih cepat.",
    checklist: ["Cek low stock", "Validasi incoming stock", "Review stock movement"],
    primaryActionLabel: "Buka Stok Kritis",
    secondaryActionLabel: "Lihat Mutasi",
  },
  laporan: {
    title: "Business Reports",
    summary: "Analisa laporan operasional untuk keputusan yang lebih presisi.",
    checklist: ["Cek performa harian", "Bandingkan antar cabang", "Export insight penting"],
    primaryActionLabel: "Buka Laporan",
    secondaryActionLabel: "Bandingkan Periode",
  },
  pickup: {
    title: "Pickup Coordination",
    summary: "Kelola jadwal pickup agar SLA layanan tetap terjaga.",
    checklist: ["Cek pickup pending", "Assign kurir", "Konfirmasi pickup selesai"],
    primaryActionLabel: "Buka Jadwal Pickup",
    secondaryActionLabel: "Assign Kurir",
  },
  meja: {
    title: "Table Management",
    summary: "Atur status meja untuk menjaga turnover dan kualitas layanan dine-in.",
    checklist: ["Cek meja terpakai", "Pindah/megabung meja", "Tutup sesi meja"],
    primaryActionLabel: "Buka Status Meja",
    secondaryActionLabel: "Kelola Sesi",
  },
  menu: {
    title: "Menu and Recipe",
    summary: "Kelola ketersediaan menu serta update struktur resep.",
    checklist: ["Cek menu aktif", "Update recipe", "Sinkronkan pricing"],
    primaryActionLabel: "Buka Daftar Menu",
    secondaryActionLabel: "Update Recipe",
  },
  products: {
    title: "Product Catalog",
    summary: "Rawat katalog produk agar listing tetap akurat dan siap jual.",
    checklist: ["Cek produk aktif", "Update harga", "Validasi varian"],
    primaryActionLabel: "Buka Katalog Produk",
    secondaryActionLabel: "Tambah Produk",
  },
  suppliers: {
    title: "Supplier Management",
    summary: "Monitor supplier dan performa pasokan untuk stabilitas stok.",
    checklist: ["Cek supplier prioritas", "Review lead time", "Validasi termin pembayaran"],
    primaryActionLabel: "Buka Daftar Supplier",
    secondaryActionLabel: "Tambah Supplier",
  },
  cabang: {
    title: "Branch Operations",
    summary: "Pantau performa tiap cabang dan sinkronisasi standar operasional.",
    checklist: ["Bandingkan cabang", "Cek jam operasional", "Review cabang bermasalah"],
    primaryActionLabel: "Buka Daftar Cabang",
    secondaryActionLabel: "Detail Cabang",
  },
  tim: {
    title: "Team Access",
    summary: "Kelola tim dan akses role agar kontrol operasional tetap aman.",
    checklist: ["Cek anggota baru", "Review role", "Audit akses sensitif"],
    primaryActionLabel: "Buka Anggota Tim",
    secondaryActionLabel: "Atur Role",
  },
  pengaturan: {
    title: "Business Settings",
    summary: "Atur konfigurasi bisnis inti untuk sinkronisasi lintas platform.",
    checklist: ["Cek profil bisnis", "Review notifikasi", "Validasi billing setting"],
    primaryActionLabel: "Buka Pengaturan",
    secondaryActionLabel: "Update Profil",
  },
};

const BUSINESS_TYPE_OVERRIDES: Partial<Record<`${BusinessType}:${string}`, Partial<ModulePreset>>> = {
  "laundry:order": {
    summary: "Kelola order cucian dari intake sampai delivery dengan status yang rapi.",
  },
  "laundry:pickup": {
    summary: "Koordinasi pickup/drop-off laundry untuk menjaga SLA dan kepuasan pelanggan.",
  },
  "fnb:order": {
    summary: "Pantau order dine-in dan takeaway agar kitchen flow tetap stabil.",
  },
  "fnb:menu": {
    summary: "Kelola menu aktif, recipe cost, dan konsistensi outlet.",
  },
  "retail:products": {
    summary: "Rawat katalog produk retail termasuk varian, harga, dan ketersediaan.",
  },
  "retail:suppliers": {
    summary: "Kelola pemasok dan kualitas supply chain untuk stok yang sehat.",
  },
};

export function getModulePreset({
  businessType,
  moduleId,
  moduleLabel,
}: ModulePresetInput): ModulePreset {
  const basePreset = GENERIC_MODULE_PRESETS[moduleId];

  if (!basePreset) {
    return {
      title: moduleLabel ? `${moduleLabel} Workspace` : "Module Workspace",
      summary: "Module ini siap dipakai, tinggal sambungkan ke action endpoint yang relevan.",
      checklist: ["Validasi akses role", "Sambungkan action utama", "Tambahkan indikator status"],
      primaryActionLabel: "Buka Workspace",
      secondaryActionLabel: "Lihat Detail",
    };
  }

  const overrideKey = `${businessType}:${moduleId}` as const;
  const override = BUSINESS_TYPE_OVERRIDES[overrideKey];

  if (!override) return basePreset;

  return {
    ...basePreset,
    ...override,
  };
}

export function getModuleFlowSpec(
  input: ModulePresetInput & { actionType: FlowActionType }
): ModuleFlowSpec {
  const preset = getModulePreset(input);
  const actionLabel =
    input.actionType === "secondary"
      ? preset.secondaryActionLabel ?? "Aksi Lanjutan"
      : preset.primaryActionLabel;

  const defaultSteps =
    input.actionType === "secondary"
      ? [
          "Review data pendukung sebelum eksekusi.",
          "Jalankan aksi lanjutan sesuai prioritas operasional.",
          "Catat hasil dan sinkronkan ke dashboard utama.",
        ]
      : [
          "Validasi konteks organisasi aktif.",
          "Jalankan aksi utama module dari mobile.",
          "Pastikan status data backend ter-update.",
        ];

  return {
    title: `${actionLabel} Flow`,
    description: `${preset.summary} Flow ini disiapkan untuk ${input.businessType.toUpperCase()} - ${input.moduleId}.`,
    steps: preset.checklist.length > 0 ? preset.checklist : defaultSteps,
    successMetric:
      input.actionType === "secondary"
        ? "Aksi lanjutan selesai tanpa blocking issue."
        : "Aksi utama selesai dan status operasional terkonfirmasi.",
  };
}
