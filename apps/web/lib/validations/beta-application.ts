import { z } from "zod";

export const betaBusinessTypeOptions = [
    "fnb",
    "retail",
    "laundry",
    "grocery",
    "services",
    "other",
] as const;

export const betaBusinessSizeOptions = [
    "solo",
    "1_5",
    "6_20",
    "21_50",
    "50_plus",
] as const;

export const betaInterestedModuleOptions = [
    "pos",
    "inventory",
    "finance_accounting",
    "multi_branch_management",
    "online_ordering",
    "delivery_fulfillment",
    "reports_analytics",
    "ai_assistant",
] as const;

export const betaReadinessOptions = [
    "curious",
    "interested_not_urgent",
    "ready_soon",
    "urgent",
] as const;

export const betaApplicationSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Nama lengkap wajib diisi")
        .max(150, "Nama terlalu panjang"),
    email: z
        .string()
        .trim()
        .email("Format email tidak valid")
        .transform((value) => value.toLowerCase()),
    phoneNumber: z
        .string()
        .trim()
        .min(6, "Nomor telepon wajib diisi")
        .max(30, "Nomor telepon terlalu panjang"),
    companyName: z
        .string()
        .trim()
        .min(2, "Nama perusahaan/bisnis wajib diisi")
        .max(150, "Nama perusahaan terlalu panjang"),
    roleInCompany: z
        .string()
        .trim()
        .min(2, "Peran di perusahaan wajib diisi")
        .max(120, "Peran terlalu panjang"),

    businessType: z.enum(betaBusinessTypeOptions, {
        errorMap: () => ({ message: "Pilih jenis bisnis" }),
    }),
    businessSize: z.enum(betaBusinessSizeOptions, {
        errorMap: () => ({ message: "Pilih skala bisnis" }),
    }),
    numberOfBranches: z.coerce
        .number()
        .int("Jumlah cabang harus angka bulat")
        .min(1, "Minimal 1 cabang")
        .max(1000, "Jumlah cabang terlalu besar"),
    currentToolsUsed: z
        .string()
        .trim()
        .min(2, "Ceritakan tools yang digunakan saat ini")
        .max(2000, "Terlalu panjang"),

    mainOperationalProblem: z
        .string()
        .trim()
        .min(5, "Wajib diisi")
        .max(4000, "Terlalu panjang"),
    currentBiggestChallenge: z
        .string()
        .trim()
        .min(5, "Wajib diisi")
        .max(4000, "Terlalu panjang"),
    expectedSolutionFromBeres: z
        .string()
        .trim()
        .min(5, "Wajib diisi")
        .max(4000, "Terlalu panjang"),

    interestedModules: z
        .array(z.enum(betaInterestedModuleOptions))
        .min(1, "Pilih minimal 1 modul"),
    betaReadiness: z.enum(betaReadinessOptions, {
        errorMap: () => ({ message: "Pilih kesiapan beta" }),
    }),
    willingnessToGiveFeedback: z.boolean(),

    source: z
        .string()
        .trim()
        .max(120, "Terlalu panjang")
        .optional(),
});

export type BetaApplicationFormValues = z.output<typeof betaApplicationSchema>;
export type BetaApplicationFormInput = z.input<typeof betaApplicationSchema>;
