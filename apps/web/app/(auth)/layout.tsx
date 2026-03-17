import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/30 relative overflow-hidden">
            <header className="w-full h-16 md:h-20 px-8 flex items-center justify-between">
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

            <main className="min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] flex items-center justify-center px-6 py-10 w-full">
                <div className="w-full max-w-[440px] flex flex-col items-center">
                    {children}
                </div>
            </main>
        </div>
    );
}
