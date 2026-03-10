import { z } from "zod";

const passwordSchema = z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf kapital")
    .regex(/[0-9]/, "Password harus mengandung minimal 1 angka")
    .regex(/[^A-Za-z0-9]/, "Password harus mengandung minimal 1 karakter spesial");

export const registerSchema = z
    .object({
        name: z
            .string()
            .min(2, "Nama minimal 2 karakter")
            .max(100, "Nama maksimal 100 karakter"),
        email: z.string().email("Format email tidak valid"),
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password tidak cocok",
        path: ["confirmPassword"],
    });

export const loginSchema = z.object({
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Format email tidak valid"),
});

export const resetPasswordSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password tidak cocok",
        path: ["confirmPassword"],
    });

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
    if (!password) return "weak";
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    const hasGoodLength = password.length >= 12;

    const score = [hasMinLength, hasUppercase, hasNumber, hasSpecial, hasGoodLength].filter(Boolean).length;

    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    return "strong";
}
