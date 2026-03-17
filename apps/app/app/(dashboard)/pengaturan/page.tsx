import { Metadata } from "next";
import { SettingsPageClient } from "./_components/settings-page-client";

export const metadata: Metadata = {
    title: "Pengaturan | Beres",
    description: "Konfigurasi organisasi dan integrasi",
};

export default function PengaturanPage() {
    return <SettingsPageClient />;
}
