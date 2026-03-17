import { Metadata } from "next";
import { PickupPageClient } from "./_components/pickup-page-client";

export const metadata: Metadata = {
    title: "Pickup & Delivery | Beres",
    description: "Monitor dan kelola order pickup/delivery",
};

export default function PickupPage() {
    return <PickupPageClient />;
}
