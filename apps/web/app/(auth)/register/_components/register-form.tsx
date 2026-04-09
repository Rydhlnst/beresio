"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { PasswordStrength } from "@/components/auth/password-strength";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [passwordValue, setPasswordValue] = useState("");

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: RegisterFormValues) {
        setIsLoading(true);
        try {
            const { error } = await authClient.signUp.email({
                name: values.name,
                email: values.email,
                password: values.password,
            });

            if (error) {
                toast.error(error.message || "Gagal membuat akun. Coba lagi.");
                return;
            }

            toast.success("Akun berhasil dibuat! Cek email kamu.");
            router.push("/verify-email?email=" + encodeURIComponent(values.email));
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full border-border shadow-sm">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight">Buat Akun Baru</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Mulai kelola bisnis laundry kamu dengan Beres
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Lengkap</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Budi Santoso"
                                            autoComplete="name"
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
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            disabled={isLoading}
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                setPasswordValue(e.target.value);
                                            }}
                                        />
                                    </FormControl>
                                    <PasswordStrength password={passwordValue} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Konfirmasi Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Mendaftarkan..." : "Daftar"}
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

                <GoogleOAuthButton callbackURL="/onboarding/org" />
            </CardContent>

            <CardFooter className="justify-center pb-6">
                <p className="text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-brand hover:underline underline-offset-4"
                    >
                        Masuk
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
