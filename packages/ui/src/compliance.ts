export type GatewayConnectionState = "not_connected" | "sandbox" | "active";

export type ProviderKey = "midtrans" | "xendit";

export type ProviderMapping = {
    provider: ProviderKey;
    role: string;
    supportedMethods: string[];
    useCases: string[];
    connectionState: GatewayConnectionState;
    notes: string;
};

export type ComplianceConfig = {
    brandName: string;
    canonicalDomain: string;
    appDomain: string;
    legalEntityName: string;
    businessAddress: string;
    supportEmail: string;
    supportWhatsApp: string;
    businessHours: string;
    complaintChannel: string;
    legalVersion: string;
    legalEffectiveDate: string;
    providerMapping: ProviderMapping[];
};

const isProduction = process.env.NODE_ENV === "production";

function getConfigValue(options: {
    envKey: string;
    fallback: string;
    requiredInProduction?: boolean;
}) {
    const rawValue = process.env[options.envKey];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (value.length > 0) {
        return value;
    }

    if (options.requiredInProduction && isProduction) {
        throw new Error(`[compliance-config] Missing required environment variable: ${options.envKey}`);
    }

    return options.fallback;
}

const defaultComplianceConfig: ComplianceConfig = {
    brandName: "Beres Cloud",
    canonicalDomain: "https://beres.io",
    appDomain: "https://app.beres.io",
    legalEntityName: "PT Beres Cloud Indonesia",
    businessAddress:
        "-",
    supportEmail: "hello@beres.io",
    supportWhatsApp: "+62 815-1796-3110",
    businessHours: "Senin-Jumat, 09.00-18.00 WIB",
    complaintChannel: "hello@beres.io",
    legalVersion: "v1.0",
    legalEffectiveDate: "15 April 2026",
    providerMapping: [
        {
            provider: "midtrans",
            role: "Gateway utama untuk pembayaran merchant (sandbox/production by activation).",
            supportedMethods: ["QRIS", "Bank transfer", "E-wallet", "Kartu kredit/debit via hosted flow"],
            useCases: ["Pembayaran transaksi merchant harian", "POS checkout branch"],
            connectionState: "sandbox",
            notes:
                "Aktivasi production dilakukan setelah verifikasi merchant dan dokumen legal lengkap.",
        },
        {
            provider: "xendit",
            role: "Gateway subscription/billing SaaS (demo mode pada UI ini).",
            supportedMethods: ["Virtual account", "QRIS", "E-wallet", "Card via hosted flow"],
            useCases: ["Tagihan langganan SaaS", "Upgrade plan organisasi"],
            connectionState: "sandbox",
            notes:
                "Flow checkout ditampilkan sebagai compliance-ready demo tanpa charge live.",
        },
    ],
};

export const complianceConfig: ComplianceConfig = {
    brandName: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_BRAND_NAME",
        fallback: defaultComplianceConfig.brandName,
    }),
    canonicalDomain: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_CANONICAL_DOMAIN",
        fallback: defaultComplianceConfig.canonicalDomain,
    }),
    appDomain: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_APP_DOMAIN",
        fallback: defaultComplianceConfig.appDomain,
    }),
    legalEntityName: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_LEGAL_ENTITY_NAME",
        fallback: defaultComplianceConfig.legalEntityName,
        requiredInProduction: true,
    }),
    businessAddress: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_BUSINESS_ADDRESS",
        fallback: defaultComplianceConfig.businessAddress,
        requiredInProduction: true,
    }),
    supportEmail: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_SUPPORT_EMAIL",
        fallback: defaultComplianceConfig.supportEmail,
        requiredInProduction: true,
    }),
    supportWhatsApp: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_SUPPORT_WHATSAPP",
        fallback: defaultComplianceConfig.supportWhatsApp,
        requiredInProduction: true,
    }),
    businessHours: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_BUSINESS_HOURS",
        fallback: defaultComplianceConfig.businessHours,
        requiredInProduction: true,
    }),
    complaintChannel: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_COMPLAINT_CHANNEL",
        fallback: defaultComplianceConfig.complaintChannel,
        requiredInProduction: true,
    }),
    legalVersion: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_LEGAL_VERSION",
        fallback: defaultComplianceConfig.legalVersion,
        requiredInProduction: true,
    }),
    legalEffectiveDate: getConfigValue({
        envKey: "NEXT_PUBLIC_COMPLIANCE_LEGAL_EFFECTIVE_DATE",
        fallback: defaultComplianceConfig.legalEffectiveDate,
        requiredInProduction: true,
    }),
    providerMapping: defaultComplianceConfig.providerMapping,
};

export function buildWhatsAppUrl(phone: string, message?: string) {
    const digits = phone.replace(/\D/g, "");
    const text = encodeURIComponent(message ?? "");
    return text.length > 0 ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/${digits}`;
}

export function buildMailtoUrl(email: string, subject: string, body?: string) {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body ?? "");
    return encodedBody
        ? `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`
        : `mailto:${email}?subject=${encodedSubject}`;
}
