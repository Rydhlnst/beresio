"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Button,
    Input,
    Heading,
    Text,
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    toast,
} from "@repo/ui";
import { Loader2, Mail, Lock, Phone, User } from "lucide-react";
import Link from "next/link";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { authClient, signUp } from "@/lib/auth-client";
import { useTransitionRouter } from "@/hooks/use-transition-router";

const signUpSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(12, "Password minimal 12 karakter"),
    phone: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { push, refresh } = useTransitionRouter();

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            phone: "",
        },
    });

    const onSubmit = async (values: SignUpFormValues) => {
        setIsLoading(true);

        try {
            const { error } = await signUp.email({
                email: values.email,
                password: values.password,
                name: values.name,
            });

            if (error) {
                toast.error(error.message || "Failed to create account");
            } else {
                await authClient.sendVerificationEmail({
                    email: values.email,
                    callbackURL: "/onboarding",
                }).catch(() => null);
                push(`/verify-email?email=${encodeURIComponent(values.email)}`);
                refresh();
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/welcome",
            });
        } catch (err) {
            toast.error("Failed to sign in with Google");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-8">
            <div className="space-y-4">
                <Heading as="h1" className="text-balance !text-xl sm:!text-2xl font-semibold tracking-tight text-foreground !leading-snug">
                    Buat Akun
                </Heading>
                <Text className="text-muted-foreground text-base">
                    Daftar untuk mulai setup Beres.
                </Text>
            </div>

            <div className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-semibold text-foreground/80">
                                            Nama Lengkap
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                                                <Input
                                                    {...field}
                                                    placeholder="Nama lengkap"
                                                    type="text"
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-background border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors duration-150 ease-out font-normal shadow-none"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-semibold text-destructive pl-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-semibold text-foreground/80">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                                                <Input
                                                    {...field}
                                                    placeholder="nama@email.com"
                                                    type="email"
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-background border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors duration-150 ease-out font-normal shadow-none"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-semibold text-destructive pl-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-semibold text-foreground/80">
                                            Password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                                <Input
                                                    {...field}
                                                    placeholder="Minimal 12 karakter"
                                                    type={showPassword ? "text" : "password"}
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-background border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors duration-150 ease-out font-normal pr-12 shadow-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground/40 hover:text-foreground transition-colors duration-150 ease-out"
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-semibold text-destructive pl-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-semibold text-foreground/80">
                                            Nomor HP <span className="font-normal text-muted-foreground">(opsional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                                <Input
                                                    {...field}
                                                    placeholder="+62 812 3456 7890"
                                                    type="tel"
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-background border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors duration-150 ease-out font-normal shadow-none"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-semibold text-destructive pl-1" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-colors duration-150 ease-out border-none shadow-none"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Daftar"}
                        </Button>
                    </form>
                </Form>

                <div className="space-y-6">
                    <div className="relative flex items-center gap-4 py-2">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground/40 uppercase">OR</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <GoogleOAuthButton
                            onClick={handleGoogleSignIn}
                            isLoading={isLoading}
                            disabled={isLoading}
                            label="Sign up with Google"
                            className="w-full h-12 rounded-xl bg-background hover:bg-muted/50 border border-input transition-colors duration-150 ease-out flex items-center justify-center gap-2 px-6 shadow-none"
                        />
                    </div>

                    <div className="text-center pt-2">
                        <Text align="center" className="text-sm text-muted-foreground">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="text-primary font-semibold hover:underline transition-colors duration-150 ease-out">
                                Login
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
