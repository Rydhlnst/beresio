import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@beresio/db";

export const auth = (db: any) => betterAuth({
    baseURL:
        process.env.BETTER_AUTH_URL ||
        (process.env.NODE_ENV !== "production" ? "http://localhost:3001" : (() => {
            throw new Error("BETTER_AUTH_URL is required in production");
        })()),
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
            team: schema.team,
            teamMember: schema.teamMember,
        }
    }),
    rateLimit: {
        window: 60,
        max: 100
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30,
        updateAge: 60 * 60 * 24
    },
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
    },
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
                        mode: {
                            type: "string",
                            required: false,
                            defaultValue: "single",
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
                },
                team: {
                    modelName: "team"
                },
                teamMember: {
                    modelName: "teamMember"
                },
            },
            teams: {
                enabled: true
            },
        }),
        nextCookies(),
    ]
});

export type Auth = ReturnType<typeof auth>;
