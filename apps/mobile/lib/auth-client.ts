import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { organizationClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

const betterAuthBaseURL =
    process.env.EXPO_PUBLIC_BETTER_AUTH_URL
    || process.env.EXPO_PUBLIC_API_URL
    || "http://localhost:3001";

export const authClient = createAuthClient({
    baseURL: betterAuthBaseURL,
    plugins: [
        expoClient({
            scheme: "beresio",
            storage: {
                setItem: SecureStore.setItem,
                getItem: SecureStore.getItem,
            },
        }),
        organizationClient()
    ],
});

export const { useSession, signIn, signOut, signUp } = authClient;
