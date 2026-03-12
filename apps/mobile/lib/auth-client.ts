import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    plugins: [
        expoClient({
            scheme: "beresio",
        }),
        organizationClient()
    ],
});
