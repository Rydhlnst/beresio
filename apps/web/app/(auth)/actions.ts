"use server";

import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { sendAccountCreatedSuccessEmail } from "@/lib/email/resend";

type SendAccountCreatedEmailInput = {
    name?: string;
    email: string;
};

async function sendAccountCreatedEmailSafely(input: SendAccountCreatedEmailInput) {
    const emailResult = await sendAccountCreatedSuccessEmail({
        to: input.email,
        name: input.name,
    });
    if (!emailResult.success) {
        console.error("sendAccountCreatedSuccessEmail failed:", emailResult.error);
    }
}

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
            await sendAccountCreatedEmailSafely({ name, email });
            return { success: true };
        }
        return { success: false, error: "Failed to create account" };
    } catch (error: any) {
        console.error("Sign up error:", error);
        return { success: false, error: error.message || "An error occurred during sign up" };
    }
}

export async function sendAccountCreatedEmailAction(input: unknown) {
    const payload = input as Partial<SendAccountCreatedEmailInput>;
    if (typeof payload?.email !== "string" || payload.email.trim().length === 0) {
        return { success: false, error: "Email wajib diisi." };
    }

    await sendAccountCreatedEmailSafely({
        email: payload.email.trim(),
        name: typeof payload.name === "string" ? payload.name : "",
    });
    return { success: true };
}
