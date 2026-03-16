"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log ke error monitoring service (Sentry, etc.)
        console.error("[Error Boundary]", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-3 max-w-md">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Oops! Terjadi Kesalahan
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Halaman mengalami masalah yang tidak terduga. Coba muat ulang halaman atau kembali ke beranda.
                </p>
                {process.env.NODE_ENV === "development" && error.message && (
                    <p className="mt-2 rounded-md bg-muted px-3 py-2 text-xs font-mono text-muted-foreground text-left">
                        {error.message}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                    onClick={reset}
                    variant="outline"
                    className="rounded-2xl gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Coba Lagi
                </Button>
                <Button asChild className="rounded-2xl bg-primary gap-2">
                    <Link href="/">
                        <Home className="h-4 w-4" />
                        Ke Beranda
                    </Link>
                </Button>
            </div>
        </div>
    );
}
