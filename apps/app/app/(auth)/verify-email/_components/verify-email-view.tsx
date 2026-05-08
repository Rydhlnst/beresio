"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Mail } from "lucide-react";

import { authClient } from "@/lib/auth-client";

import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/card";

const COOLDOWN_SECONDS = 60;

interface VerifyEmailViewProps {
    email: string;
}

export function VerifyEmailView({ email }: VerifyEmailViewProps) {
    const [cooldown, setCooldown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = useCallback(async () => {
        if (!email || cooldown > 0) return;
        setIsLoading(true);
        try {
            await authClient.sendVerificationEmail({ email, callbackURL: "/onboarding" });
            toast.success("Email verifikasi telah dikirim ulang!");
            setCooldown(COOLDOWN_SECONDS);
        } catch {
            toast.error("Gagal mengirim email. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }, [email, cooldown]);

    return (
        <Card className="w-full border-border">
            <CardHeader className="items-center space-y-4 pb-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <Mail className="size-8 text-primary" />
                </div>
                <div className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                        Cek Email Kamu
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Kami mengirim link verifikasi ke{" "}
                        <span className="font-semibold text-foreground">{email || "email kamu"}</span>
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <Button
                    className="w-full"
                    onClick={handleResend}
                    disabled={isLoading || cooldown > 0}
                >
                    {isLoading
                        ? "Mengirim..."
                        : cooldown > 0
                            ? `Kirim Ulang (${cooldown}s)`
                            : "Kirim Ulang Email"}
                </Button>

                <Button variant="ghost" className="w-full" asChild>
                    <Link href="/register">Ganti Email</Link>
                </Button>
            </CardContent>

            <CardFooter className="justify-center pb-6">
                <p className="text-sm text-muted-foreground">
                    Email sudah terverifikasi?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-primary hover:underline underline-offset-4"
                    >
                        Masuk
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
