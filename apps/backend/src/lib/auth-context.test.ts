import { describe, expect, it } from "vitest";
import { getOrgId } from "./auth-context";

describe("getOrgId", () => {
    it("returns activeOrganizationId from session", async () => {
        const context = {
            get: (key: string) => {
                if (key === "session") return { activeOrganizationId: "org-active" };
                return null;
            },
        } as any;

        await expect(getOrgId(context)).resolves.toBe("org-active");
    });

    it("falls back to organizationId in session", async () => {
        const context = {
            get: (key: string) => {
                if (key === "session") return { organizationId: "org-session" };
                return null;
            },
        } as any;

        await expect(getOrgId(context)).resolves.toBe("org-session");
    });

    it("falls back to activeOrganizationId in user context", async () => {
        const context = {
            get: (key: string) => {
                if (key === "session") return {};
                if (key === "user") return { activeOrganizationId: "org-user" };
                return null;
            },
        } as any;

        await expect(getOrgId(context)).resolves.toBe("org-user");
    });

    it("falls back to first membership when org context is missing", async () => {
        const db = {
            select: () => ({
                from: () => ({
                    where: () => ({
                        limit: async () => [{ organizationId: "org-membership" }],
                    }),
                }),
            }),
        };

        const context = {
            get: (key: string) => {
                if (key === "session") return {};
                if (key === "user") return { id: "user-1" };
                if (key === "db") return db;
                return null;
            },
        } as any;

        await expect(getOrgId(context)).resolves.toBe("org-membership");
    });

    it("throws when no organization context is available", async () => {
        const context = {
            get: () => ({ }),
        } as any;

        await expect(getOrgId(context)).rejects.toThrow("NO_ORG_CONTEXT");
    });
});
