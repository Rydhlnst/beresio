import { afterEach, describe, expect, it, vi } from "vitest";

const TEST_TO = "rydhlnst@gmail.com";

type MockSendResponse = {
    data?: { id?: string | null } | null;
    error?: { message: string } | null;
};

function stubEnv(values: Record<string, string | undefined>) {
    for (const [k, v] of Object.entries(values)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules(); // important: `resend.tsx` reads env at import time
    stubEnv({
        RESEND_API_KEY: undefined,
        RESEND_FROM_EMAIL: undefined,
        NEXT_PUBLIC_APP_URL: undefined,
        BETTER_AUTH_URL: undefined,
        SUPPORT_EMAIL: undefined,
    });
});

describe("apps/web/lib/email/resend.tsx", () => {
    it("[OK] AC-EMAIL-01 sendAccountCreatedSuccessEmail calls Resend with to=[rydhlnst@gmail.com] and returns id", async () => {
        stubEnv({
            RESEND_API_KEY: "re_test",
            RESEND_FROM_EMAIL: "Beres Cloud <hello@beres.io>",
            NEXT_PUBLIC_APP_URL: "https://example.test",
            SUPPORT_EMAIL: "support@example.test",
        });

        const sendMock = vi.fn<[], Promise<MockSendResponse>>().mockResolvedValue({
            data: { id: "email_123" },
            error: null,
        });

        vi.doMock("react-email", () => ({
            render: vi.fn(async (_template: unknown, opts?: unknown) => {
                // We only need deterministic outputs for html + text.
                if (typeof opts === "object" && opts && "plainText" in (opts as any)) return "TEXT";
                return "HTML";
            }),
        }));

        vi.doMock("resend", () => ({
            Resend: class Resend {
                emails = { send: sendMock };
                constructor(_key: string) {}
            },
        }));

        const mod = await import("./resend");

        const result = await mod.sendAccountCreatedSuccessEmail({
            to: TEST_TO,
            name: "Rydhlnst",
        });

        expect(result).toEqual({ success: true, id: "email_123" });
        expect(sendMock).toHaveBeenCalledTimes(1);

        const [payload] = sendMock.mock.calls[0] ?? [];
        expect(payload).toMatchObject({
            to: [TEST_TO],
            subject: "Akun Beres Cloud berhasil dibuat",
            html: "HTML",
            text: "TEXT",
        });
        expect(payload.from).toContain("Beres Cloud");
    });

    it("[OK] AC-EMAIL-02 sendWishlistSuccessEmail uses correct subject and to=[rydhlnst@gmail.com]", async () => {
        stubEnv({ RESEND_API_KEY: "re_test" });

        const sendMock = vi.fn<[], Promise<MockSendResponse>>().mockResolvedValue({
            data: { id: null },
            error: null,
        });

        vi.doMock("react-email", () => ({
            render: vi.fn(async (_template: unknown, opts?: unknown) => {
                if (typeof opts === "object" && opts && "plainText" in (opts as any)) return "TEXT";
                return "HTML";
            }),
        }));

        vi.doMock("resend", () => ({
            Resend: class Resend {
                emails = { send: sendMock };
                constructor(_key: string) {}
            },
        }));

        const mod = await import("./resend");

        const result = await mod.sendWishlistSuccessEmail({
            to: TEST_TO,
            fullName: "Rydhlnst",
        });

        expect(result).toEqual({ success: true, id: null });

        const [payload] = sendMock.mock.calls[0] ?? [];
        expect(payload).toMatchObject({
            to: [TEST_TO],
            subject: "Wishlist Beres Cloud berhasil terkirim",
        });
    });

    it("[ERR] AC-EMAIL-03 missing RESEND_API_KEY returns explicit error and does not call Resend", async () => {
        stubEnv({ RESEND_API_KEY: undefined });

        const sendMock = vi.fn();

        vi.doMock("react-email", () => ({
            render: vi.fn(async () => "HTML"),
        }));

        vi.doMock("resend", () => ({
            Resend: class Resend {
                emails = { send: sendMock };
                constructor(_key: string) {}
            },
        }));

        const mod = await import("./resend");

        const result = await mod.sendAccountCreatedSuccessEmail({
            to: TEST_TO,
            name: "Rydhlnst",
        });

        expect(result.success).toBe(false);
        expect(result).toEqual({ success: false, error: "RESEND_API_KEY belum di-set" });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("[ERR] AC-EMAIL-04 Resend returns error -> surface message", async () => {
        stubEnv({ RESEND_API_KEY: "re_test" });

        const sendMock = vi.fn<[], Promise<MockSendResponse>>().mockResolvedValue({
            data: null,
            error: { message: "Invalid `from` domain" },
        });

        vi.doMock("react-email", () => ({
            render: vi.fn(async () => "HTML"),
        }));

        vi.doMock("resend", () => ({
            Resend: class Resend {
                emails = { send: sendMock };
                constructor(_key: string) {}
            },
        }));

        const mod = await import("./resend");

        const result = await mod.sendWishlistSuccessEmail({
            to: TEST_TO,
            fullName: "Rydhlnst",
        });

        expect(result).toEqual({ success: false, error: "Invalid `from` domain" });
    });

    it("[ERR] AC-EMAIL-05 render throws -> returns error message", async () => {
        stubEnv({ RESEND_API_KEY: "re_test" });

        const sendMock = vi.fn<[], Promise<MockSendResponse>>().mockResolvedValue({
            data: { id: "email_123" },
            error: null,
        });

        vi.doMock("react-email", () => ({
            render: vi.fn(async () => {
                throw new Error("render failed");
            }),
        }));

        vi.doMock("resend", () => ({
            Resend: class Resend {
                emails = { send: sendMock };
                constructor(_key: string) {}
            },
        }));

        const mod = await import("./resend");

        const result = await mod.sendAccountCreatedSuccessEmail({
            to: TEST_TO,
            name: "Rydhlnst",
        });

        expect(result).toEqual({ success: false, error: "render failed" });
        expect(sendMock).not.toHaveBeenCalled();
    });
});

