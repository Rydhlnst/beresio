"use server";

import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";

export async function signInAction(formData: any) {
    const { email } = formData;
    const db = createDbNextjs(process.env.DATABASE_URL!);

    try {
        const existingUser = await db.query.user.findFirst({
            where: (users: any, { eq }: any) => eq(users.email, email),
        });

        if (!existingUser) {
            return { success: false, error: "Account not found" };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Sign in error:", error);
        return { success: false, error: error.message || "An error occurred during account validation" };
    }
}

export async function signUpAction(formData: any) {
    const { name, email, password } = formData;
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
