import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen flex flex-col bg-background font-sans selection:bg-primary/30 relative overflow-hidden">
            {/* Simple Header - Absolute to not affect centering */}
            <header className="absolute top-0 left-0 right-0 w-full px-8 py-8 flex items-center justify-between z-20">
                <div className="w-full max-w-[440px] md:max-w-none mx-auto flex items-center justify-between">
                    <Link href="/" className="transition-transform hover:scale-105">
                        <Image
                            src="/logo.svg"
                            alt="Beres logo"
                            width={100}
                            height={28}
                            className="h-7 w-auto"
                        />
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/privacy"
                            className="text-xs font-bold text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-xs font-bold text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                            Terms
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Form Area: Perfectly Centered */}
            <main className="flex-1 flex items-center justify-center p-6 relative z-10 w-full h-full">
                <div className="w-full max-w-[440px] flex flex-col items-center">
                    {children}
                </div>
            </main>
        </div>
    );
}
