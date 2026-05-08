"use server";

import { headers } from "next/headers";
import { createDbNextjs, betaApplications } from "@beresio/db";
import { auth } from "@/lib/auth";
import { betaApplicationSchema } from "@/lib/validations/beta-application";
import { cookies } from "next/headers";
import { sendWishlistSuccessEmail } from "@/lib/email/resend";

type ActionResult =
    | { success: true; data: { id: string; alreadyRegistered?: boolean } }
    | { success: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

function isPgUniqueViolation(error: unknown) {
    const anyError = error as { code?: unknown; message?: unknown } | null;
    const code = typeof anyError?.code === "string" ? anyError.code : "";
    const message = typeof anyError?.message === "string" ? anyError.message : "";
    return code === "23505" || message.includes("uq_beta_applications_email");
}

async function sendWishlistEmailSafely(input: { fullName: string; email: string }) {
    const result = await sendWishlistSuccessEmail({
        to: input.email,
        fullName: input.fullName,
    });

    if (!result.success) {
        console.error("sendWishlistSuccessEmail failed:", result.error);
    }
}

export async function createBetaApplicationAction(input: unknown): Promise<ActionResult> {
    const parsed = betaApplicationSchema.safeParse(input);
    if (!parsed.success) {
        const flattened = parsed.error.flatten();
        return {
            success: false,
            error: "Data tidak valid",
            fieldErrors: flattened.fieldErrors,
        };
    }

    const db = createDbNextjs(process.env.DATABASE_URL!);
    const requestHeaders = await headers();

    const existing = await db.query.betaApplications.findFirst({
        where: (table, { eq }) => eq(table.email, parsed.data.email),
        columns: { id: true },
    });

    if (existing) {
        (await cookies()).set("beta_application_id", existing.id, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
        });
        return { success: true, data: { id: existing.id, alreadyRegistered: true } };
    }

    let userId: string | null = null;
    try {
        const session = await auth(db).api.getSession({ headers: requestHeaders });
        userId = session?.user?.id ?? null;
    } catch {
        userId = null;
    }

    try {
        const [created] = await db
            .insert(betaApplications)
            .values({
                userId,
                fullName: parsed.data.fullName,
                email: parsed.data.email,
                phoneNumber: parsed.data.phoneNumber,
                companyName: parsed.data.companyName,
                roleInCompany: parsed.data.roleInCompany,
                businessType: parsed.data.businessType,
                businessSize: parsed.data.businessSize,
                numberOfBranches: parsed.data.numberOfBranches,
                currentToolsUsed: parsed.data.currentToolsUsed,
                mainOperationalProblem: parsed.data.mainOperationalProblem,
                currentBiggestChallenge: parsed.data.currentBiggestChallenge,
                expectedSolutionFromBeres: parsed.data.expectedSolutionFromBeres,
                interestedModules: parsed.data.interestedModules,
                betaReadiness: parsed.data.betaReadiness,
                willingnessToGiveFeedback: parsed.data.willingnessToGiveFeedback,
                source: parsed.data.source && parsed.data.source.length > 0 ? parsed.data.source : null,
            })
            .returning({ id: betaApplications.id });

        const id = created?.id;
        if (!id) return { success: false, error: "Gagal menyimpan aplikasi beta." };
        (await cookies()).set("beta_application_id", id, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
        });
        await sendWishlistEmailSafely({
            fullName: parsed.data.fullName,
            email: parsed.data.email,
        });
        return { success: true, data: { id } };
    } catch (error) {
        if (isPgUniqueViolation(error)) {
            const already = await db.query.betaApplications.findFirst({
                where: (table, { eq }) => eq(table.email, parsed.data.email),
                columns: { id: true },
            });
            if (already) {
                (await cookies()).set("beta_application_id", already.id, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: 60 * 60 * 24 * 365,
                });
                return { success: true, data: { id: already.id, alreadyRegistered: true } };
            }
            return { success: false, error: "Email sudah terdaftar di waitlist beta." };
        }
        console.error("createBetaApplicationAction error:", error);
        return { success: false, error: "Terjadi kesalahan saat memproses aplikasi." };
    }
}
