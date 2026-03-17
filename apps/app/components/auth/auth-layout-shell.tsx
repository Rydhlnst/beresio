import Link from "next/link";
import Image from "next/image";

interface AuthLayoutShellProps {
    children: React.ReactNode;
    maxWidth?: string;
}

export function AuthLayoutShell({
    children,
    maxWidth = "max-w-[440px]",
}: AuthLayoutShellProps) {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-primary/30 relative overflow-hidden">
            <header className="w-full h-16 md:h-20 px-8 flex items-center justify-between">
                <div className={`w-full ${maxWidth} md:max-w-none mx-auto flex items-center justify-between text-center`}>
                    <Link href="http://localhost:3000" className="transition-opacity duration-150 ease-out hover:opacity-80">
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
                            href="http://localhost:3000/privacy"
                            className="text-xs font-semibold text-muted-foreground/40 hover:text-foreground transition-colors duration-150 ease-out"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="http://localhost:3000/terms"
                            className="text-xs font-semibold text-muted-foreground/40 hover:text-foreground transition-colors duration-150 ease-out"
                        >
                            Terms
                        </Link>
                    </div>
                </div>
            </header>

            <main className="min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] flex items-center justify-center px-6 py-10 w-full">
                <div className={`w-full ${maxWidth} flex flex-col items-center`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
