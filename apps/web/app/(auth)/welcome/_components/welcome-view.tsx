"use client";

import { Building2, Users } from "lucide-react";
import Link from "next/link";

interface WelcomeViewProps {
    userName: string;
}

export function WelcomeView({ userName }: WelcomeViewProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-10 text-center">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Halo {userName}!
                </h1>
                <p className="text-xl text-muted-foreground">
                    Kamu di sini untuk?
                </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                <Link
                    href="/onboarding/org"
                    className="flex flex-col items-center p-8 space-y-4 border rounded-xl bg-card border-border hover:border-brand hover:bg-accent/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                >
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 group-hover:bg-brand/20 transition-colors">
                        <Building2 className="w-8 h-8 text-brand" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-xl font-semibold">Saya punya bisnis</h3>
                        <p className="text-sm text-muted-foreground">
                            Daftarkan bisnis saya dan kelola tim
                        </p>
                    </div>
                </Link>

                <Link
                    href="/join"
                    className="flex flex-col items-center p-8 space-y-4 border rounded-xl bg-card border-border hover:border-brand hover:bg-accent/50 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                >
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 group-hover:bg-brand/20 transition-colors">
                        <Users className="w-8 h-8 text-brand" />
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-xl font-semibold">Saya diundang seseorang</h3>
                        <p className="text-sm text-muted-foreground">
                            Bergabung ke bisnis yang sudah ada
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
