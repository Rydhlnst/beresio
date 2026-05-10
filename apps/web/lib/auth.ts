import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@beresio/db";

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
}

export const auth = (db: any) => betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
            organization: schema.organization,
            member: schema.member,
            invitation: schema.invitation,
        }
    }),
    rateLimit: {
        window: 60, // 1 minute
        max: 100 // 100 requests per minute
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24 // 1 day
    },
    emailAndPassword: {
        enabled: true
    },
    socialProviders,
    plugins: [
        organization({
            schema: {
                organization: {
                    modelName: "organization",
                    additionalFields: {
                        businessType: {
                            type: "string",
                            required: true
                        },
                        subscriptionPlan: {
                            type: "string",
                            required: false,
                            defaultValue: "starter"
                        },
                        logoUrl: {
                            type: "string",
                            required: false
                        }
                    }
                },
                member: {
                    modelName: "member"
                },
                invitation: {
                    modelName: "invitation"
                }
            }
        }),
        nextCookies(),
    ]
});
