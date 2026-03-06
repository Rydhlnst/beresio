"use server";

import { auth } from "@/lib/auth";
import { db } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInAction(formData: any) {
    const { email, password } = formData;

    try {
        const existingUser = await db.query.user.findFirst({
            where: (users: any, { eq }: any) => eq(users.email, email),
        });

        if (!existingUser) {
            return { success: false, error: "Account not found" };
        }
        const result = await auth(db).api.signInEmail({
            body: {
                email,
                password,
            },
            headers: await headers(),
        });

        if (result.token || result.user) {
            return { success: true };
        }
        return { success: false, error: "Invalid credentials" };
    } catch (error: any) {
        return { success: false, error: error.message || "An error occurred during sign in" };
    }
}

export async function signUpAction(formData: any) {
    const { name, email, password } = formData;

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
        return { success: false, error: error.message || "An error occurred during sign up" };
    }
}
