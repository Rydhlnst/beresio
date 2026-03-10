"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    async function onSubmit(values: ForgotPasswordFormValues) {
        setIsLoading(true);
        try {
            await authClient.requestPasswordReset({
                email: values.email,
                redirectTo: "/reset-password",
            });
            setSubmittedEmail(values.email);
            setIsSuccess(true);
        } catch {
            // Show success state anyway to prevent email enumeration
            setSubmittedEmail(values.email);
            setIsSuccess(true);
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <Card className="w-full border-border shadow-sm">
                <CardHeader className="items-center space-y-4 pb-4">
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                        <CheckCircle className="size-8 text-green-500" />
                    </div>
                    <div className="space-y-1 text-center">
                        <CardTitle className="text-xl font-bold tracking-tight">
                            Email Terkirim!
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Jika akun dengan email{" "}
                            <span className="font-medium text-foreground">{submittedEmail}</span>{" "}
                            terdaftar, kamu akan menerima link reset password.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardFooter className="justify-center pb-6">
                    <Button variant="ghost" asChild>
                        <Link href="/login">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali ke Halaman Masuk
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full border-border shadow-sm">
            <CardHeader className="space-y-1 pb-4">
                <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-1 gap-1.5" asChild>
                    <Link href="/login">
                        <ArrowLeft className="size-4" />
                        Kembali
                    </Link>
                </Button>
                <CardTitle className="text-2xl font-bold tracking-tight">Lupa Password</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Masukkan email kamu dan kami akan mengirim link untuk reset password
                </CardDescription>
            </CardHeader>

            <CardContent>
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

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Mengirim..." : "Kirim Link Reset"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
