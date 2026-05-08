import type { Metadata } from "next";
import RoleNewPageClient from "./role-new-page-client";

export const metadata: Metadata = {
    title: "Buat Role Baru",
    description: "Tambah role baru dan atur izin akses tim.",
};

export default function RoleNewPage() {
    return <RoleNewPageClient />;
}
