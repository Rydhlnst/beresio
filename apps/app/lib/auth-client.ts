import { createAuthClient } from "better-auth/react";
import { organizationClient, inferOrgAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "./auth";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
    plugins: [
        organizationClient({
            schema: inferOrgAdditionalFields<Auth>(),
            teams: {
                enabled: true
            },
        })
    ],
});

export const { useSession, signIn, signOut, signUp } = authClient;
