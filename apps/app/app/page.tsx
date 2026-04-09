import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Akses dashboard utama Beres.",
};

export default function HomePage() {
    redirect("/dashboard");
}
