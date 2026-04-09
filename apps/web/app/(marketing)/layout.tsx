import type { ReactNode } from "react";
import { Navbar } from "@/app/_components/Navbar";
import { Footer } from "@/app/_components/Footer";

export default function MarketingLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="min-h-screen w-full bg-background relative z-10">
                {children}
            </main>
            <Footer />
        </>
    );
}
