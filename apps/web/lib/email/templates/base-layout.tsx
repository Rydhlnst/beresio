import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "react-email";
import type { CSSProperties, ReactNode } from "react";

type BaseLayoutProps = {
    preview: string;
    heading: string;
    children: ReactNode;
    appUrl?: string;
    supportEmail?: string;
};

const bodyStyle: CSSProperties = {
    backgroundColor: "#f7f7f8",
    fontFamily: "Inter, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
};

const containerStyle: CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #e7e7ea",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "24px",
};

const logoStyle: CSSProperties = {
    display: "block",
    height: "48px",
    width: "35px",
};

const headingStyle: CSSProperties = {
    color: "#111827",
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "30px",
    margin: "0 0 8px",
};

const dividerStyle: CSSProperties = {
    borderColor: "#ececf1",
    margin: "20px 0",
};

const footerTextStyle: CSSProperties = {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "20px",
    margin: "8px 0 0",
};

export function BaseEmailLayout({
    preview,
    heading,
    children,
    appUrl = "http://localhost:3000",
    supportEmail = "support@beres.cloud",
}: BaseLayoutProps) {
    const normalizedBaseUrl = appUrl.replace(/\/$/, "");
    const logoUrl = `${normalizedBaseUrl}/logo.svg`;

    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Body style={bodyStyle}>
                <Container style={containerStyle}>
                    <Section>
                        <Img src={logoUrl} alt="Beres Cloud" width="35" height="48" style={logoStyle} />
                    </Section>

                    <Section style={{ marginTop: "18px" }}>
                        <Heading style={headingStyle}>{heading}</Heading>
                    </Section>

                    <Section>{children}</Section>

                    <Hr style={dividerStyle} />

                    <Text style={footerTextStyle}>
                        Butuh bantuan? Balas email ini atau hubungi{" "}
                        <Link href={`mailto:${supportEmail}`} style={{ color: "#ee4822" }}>
                            {supportEmail}
                        </Link>
                        .
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
