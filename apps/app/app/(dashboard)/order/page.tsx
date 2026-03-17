import { Metadata } from "next";
import { OrderPageClient } from "./_components/order-page-client";

export const metadata: Metadata = {
    title: "Order | Beres",
    description: "Pantau semua order lintas cabang secara real-time",
};

export default function OrderPage() {
    return <OrderPageClient />;
}
