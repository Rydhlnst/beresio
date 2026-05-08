import { Button, Section, Text } from "react-email";
import type { CSSProperties } from "react";

import { BaseEmailLayout } from "./base-layout";

export type AccountCreatedSuccessEmailProps = {
    name?: string | null;
    appUrl?: string;
    supportEmail?: string;
};

const paragraphStyle: CSSProperties = {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 14px",
};

const buttonStyle: CSSProperties = {
    backgroundColor: "#ee4822",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "14px",
    padding: "12px 18px",
    textDecoration: "none",
};

export function AccountCreatedSuccessEmail({
    name,
    appUrl = "http://localhost:3000",
    supportEmail = "support@beres.cloud",
}: AccountCreatedSuccessEmailProps) {
    const firstName = (name ?? "").trim().split(" ")[0] ?? "";
    const greetingName = firstName.length > 0 ? firstName : "teman";
    const normalizedBaseUrl = appUrl.replace(/\/$/, "");

    return (
        <BaseEmailLayout
            preview="Akun Beres Cloud kamu sudah aktif."
            heading="Akun berhasil dibuat"
            appUrl={normalizedBaseUrl}
            supportEmail={supportEmail}
        >
            <Text style={paragraphStyle}>Halo {greetingName},</Text>
            <Text style={paragraphStyle}>
                Akun Beres Cloud kamu sudah berhasil dibuat. Kamu sekarang bisa masuk dan mulai setup bisnis, cabang, serta tim.
            </Text>
            <Section style={{ margin: "20px 0 6px" }}>
                <Button href={`${normalizedBaseUrl}/login`} style={buttonStyle}>
                    Masuk ke Dashboard
                </Button>
            </Section>
            <Text style={paragraphStyle}>
                Kalau kamu belum verifikasi email, cek inbox untuk lanjut aktivasi akses penuh akun.
            </Text>
        </BaseEmailLayout>
    );
}
