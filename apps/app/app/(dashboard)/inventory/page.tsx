import { Metadata } from "next";
import { InventoryPageClient } from "./_components/inventory-page-client";

export const metadata: Metadata = {
    title: "Inventory | Beres",
    description: "Pantau stok lintas cabang dan kelola transfer",
};

export default function InventoryPage() {
    return <InventoryPageClient />;
}
