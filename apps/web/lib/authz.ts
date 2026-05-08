import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createDbNextjs } from "@beresio/db";
import { auth } from "@/lib/auth";

type SessionPayload = Awaited<ReturnType<ReturnType<typeof auth>["api"]["getSession"]>>;

export async function requireSession() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const requestHeaders = await headers();

    const session = (await authInstance.api.getSession({
        headers: requestHeaders,
    })) as SessionPayload;

    if (!session) {
        redirect("/login");
    }

    return { session, auth: authInstance, headers: requestHeaders };
}

export async function requireSessionWithOrganization() {
    const ctx = await requireSession();

    const orgs = await ctx.auth.api.listOrganizations({
        headers: ctx.headers,
    });

    if (!orgs || orgs.length === 0) {
        redirect("/welcome");
    }

    return { ...ctx, organizations: orgs };
}

