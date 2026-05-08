"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginFormValues) {
        setIsLoading(true);
        try {
            const { data, error } = await authClient.signIn.email({
                email: values.email,
                password: values.password,
            });

            if (error) {
                toast.error(error.message || "Email atau password salah.");
                return;
            }

            // Check if user has verified email
            if (!data.user.emailVerified) {
                router.push("/verify-email?email=" + encodeURIComponent(values.email));
                return;
            }

            // Check if user has an organization
            const orgData = await authClient.organization.list();
            const hasOrg = orgData?.data && orgData.data.length > 0;

            if (hasOrg) {
                router.push("/dashboard");
            } else {
                router.push("/welcome");
            }
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full border-border shadow-sm">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight">Selamat Datang</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Masuk ke akun Beres kamu untuk melanjutkan
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="budi@laundry.com"
                                            autoComplete="email"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                                        >
                                            Lupa password?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Memproses..." : "Masuk"}
                        </Button>
                    </form>
                </Form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">atau</span>
                    </div>
                </div>

                <GoogleOAuthButton callbackURL="/welcome" />
            </CardContent>

            <CardFooter className="justify-center pb-6">
                <p className="text-sm text-muted-foreground">
                    Belum punya akun?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-brand hover:underline underline-offset-4"
                    >
                        Daftar
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
