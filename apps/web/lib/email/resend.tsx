import { render } from "react-email";
import { Resend } from "resend";
import type { ReactElement } from "react";

import { AccountCreatedSuccessEmail, WishlistSuccessEmail } from "./templates";

type SendTemplateResult =
    | { success: true; id: string | null }
    | { success: false; error: string };

const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const defaultFrom = process.env.RESEND_FROM_EMAIL ?? "Beres Cloud <hello@beres.io>";
const defaultSupportEmail = process.env.SUPPORT_EMAIL ?? "hello@beres.io";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendTemplateEmail(params: {
    to: string;
    subject: string;
    template: ReactElement;
}): Promise<SendTemplateResult> {
    if (!resend) return { success: false, error: "RESEND_API_KEY belum di-set" };

    try {
        const html = await render(params.template, { pretty: true });
        const text = await render(params.template, { plainText: true });

        const response = await resend.emails.send({
            from: defaultFrom,
            to: [params.to],
            subject: params.subject,
            html,
            text,
        });

        if (response.error) return { success: false, error: response.error.message };
        return { success: true, id: response.data?.id ?? null };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal mengirim email";
        return { success: false, error: message };
    }
}

export async function sendAccountCreatedSuccessEmail(input: {
    to: string;
    name?: string | null;
    appUrl?: string;
    supportEmail?: string;
}): Promise<SendTemplateResult> {
    return sendTemplateEmail({
        to: input.to,
        subject: "Akun Beres Cloud berhasil dibuat",
        template: (
            <AccountCreatedSuccessEmail
                name={input.name}
                appUrl={input.appUrl ?? defaultAppUrl}
                supportEmail={input.supportEmail ?? defaultSupportEmail}
            />
        ),
    });
}

export async function sendWishlistSuccessEmail(input: {
    to: string;
    fullName: string;
    appUrl?: string;
    supportEmail?: string;
}): Promise<SendTemplateResult> {
    return sendTemplateEmail({
        to: input.to,
        subject: "Wishlist Beres Cloud berhasil terkirim",
        template: (
            <WishlistSuccessEmail
                fullName={input.fullName}
                appUrl={input.appUrl ?? defaultAppUrl}
                supportEmail={input.supportEmail ?? defaultSupportEmail}
            />
        ),
    });
}
