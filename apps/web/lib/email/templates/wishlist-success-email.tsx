import { Button, Section, Text } from "react-email";
import type { CSSProperties } from "react";

import { BaseEmailLayout } from "./base-layout";

export type WishlistSuccessEmailProps = {
    fullName: string;
    appUrl?: string;
    supportEmail?: string;
};

const paragraphStyle: CSSProperties = {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 14px",
};

const listStyle: CSSProperties = {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
    paddingLeft: "18px",
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

export function WishlistSuccessEmail({
    fullName,
    appUrl = "http://localhost:3000",
    supportEmail = "support@beres.cloud",
}: WishlistSuccessEmailProps) {
    const normalizedBaseUrl = appUrl.replace(/\/$/, "");

    return (
        <BaseEmailLayout
            preview="Terima kasih sudah join wishlist Beres Cloud."
            heading="Wishlist kamu berhasil terkirim"
            appUrl={normalizedBaseUrl}
            supportEmail={supportEmail}
        >
            <Text style={paragraphStyle}>Halo {fullName},</Text>
            <Text style={paragraphStyle}>
                Terima kasih sudah mendaftar wishlist Beres Cloud. Tim kami sudah menerima data kamu dan akan review untuk tahap berikutnya.
            </Text>
            <Text style={paragraphStyle}>Yang terjadi selanjutnya:</Text>
            <ul style={listStyle}>
                <li>Tim Beres Cloud evaluasi kebutuhan bisnis kamu.</li>
                <li>Kami hubungi lewat email/WhatsApp jika cocok untuk early access.</li>
                <li>Kamu akan dapat update fitur terbaru lebih dulu.</li>
            </ul>
            <Section style={{ margin: "20px 0 6px" }}>
                <Button href={`${normalizedBaseUrl}/wishlist`} style={buttonStyle}>
                    Lihat Halaman Wishlist
                </Button>
            </Section>
            <Text style={paragraphStyle}>
                Ada pertanyaan? Balas email ini atau kirim ke {supportEmail}.
            </Text>
        </BaseEmailLayout>
    );
}
