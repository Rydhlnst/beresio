"use server";

import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { z } from "zod";

const signInSchema = z.object({
    email: z.string().email(),
});

const signUpSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function signInAction(formData: unknown) {
    signInSchema.parse(formData);
    // Intentionally return a generic success to avoid account enumeration.
    return { success: true };
}

export async function signUpAction(formData: unknown) {
    const { name, email, password } = signUpSchema.parse(formData);
    const db = createDbNextjs(process.env.DATABASE_URL!);

    try {
        const result = await auth(db).api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
            headers: await headers(),
        });

        if (result.user) {
            return { success: true };
        }
        return { success: false, error: "Failed to create account" };
    } catch (error: any) {
        console.error("Sign up error:", error);
        return { success: false, error: error.message || "An error occurred during sign up" };
    }
}
