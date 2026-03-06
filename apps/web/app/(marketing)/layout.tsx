import { Navbar } from "../_components/Navbar";
import { Footer } from "../_components/Footer";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <div className="mx-auto max-w-[1400px] border-x border-border/50 min-h-screen bg-background relative shadow-sm">
                <main>{children}</main>
            </div>
            <Footer />
        </>
    );
}
