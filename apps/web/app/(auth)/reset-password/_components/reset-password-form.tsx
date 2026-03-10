"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { PasswordStrength } from "@/components/auth/password-strength";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [passwordValue, setPasswordValue] = useState("");

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values: ResetPasswordFormValues) {
        setIsLoading(true);
        try {
            const { error } = await authClient.resetPassword({
                newPassword: values.password,
                token,
            });

            if (error) {
                toast.error(error.message || "Gagal mereset password. Link mungkin sudah kadaluarsa.");
                return;
            }

            toast.success("Password berhasil direset! Silakan masuk.");
            router.push("/login");
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full border-border shadow-sm">
            <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Buat password baru yang kuat untuk akunmu
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password Baru</FormLabel>
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
                                    <FormLabel>Konfirmasi Password Baru</FormLabel>
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
                            {isLoading ? "Memproses..." : "Reset Password"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
