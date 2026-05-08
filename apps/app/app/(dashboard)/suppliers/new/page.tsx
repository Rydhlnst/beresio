import type { Metadata } from "next";
import NewSupplierPageClient from "./new-supplier-page-client";

export const metadata: Metadata = {
    title: "Tambah Pemasok",
    description: "Tambah pemasok baru untuk kebutuhan pengadaan.",
};

export default function NewSupplierPage() {
    return <NewSupplierPageClient />;
}
