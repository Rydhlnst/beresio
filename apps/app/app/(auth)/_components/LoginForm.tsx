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
import { Loader2, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { authClient, signIn } from "@/lib/auth-client";
import { useTransitionRouter } from "@/hooks/use-transition-router";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    remember: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { push, refresh } = useTransitionRouter();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            remember: false,
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setIsLoading(true);

        try {
            const { error } = await signIn.email({
                email: values.email,
                password: values.password,
                rememberMe: values.remember,
            });

            if (error) {
                toast.error("Email atau password tidak valid");
            } else {
                push("/");
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
                callbackURL: "/",
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
                    Log in to your account
                </Heading>
                <Text className="text-muted-foreground text-base">
                    Please enter your details
                </Text>
            </div>

            <div className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
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
                                                    placeholder="Enter your email"
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
                                                    placeholder="••••••••"
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
                        </div>

                        <div className="flex items-center justify-between">
                            <FormField
                                control={form.control}
                                name="remember"
                                render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                id="remember"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <label htmlFor="remember" className="text-sm text-muted-foreground/80 cursor-pointer">
                                            Remember for 30 days
                                        </label>
                                    </div>
                                )}
                            />
                            <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity duration-150 ease-out">
                                Forgot password
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-colors duration-150 ease-out border-none shadow-none"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Log in"}
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
                            label="Log in with Google"
                            className="w-full h-12 rounded-xl bg-background hover:bg-muted/50 border border-input transition-colors duration-150 ease-out flex items-center justify-center gap-2 px-6 shadow-none"
                        />
                    </div>

                    <div className="text-center pt-2">
                        <Text align="center" className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link href="/sign-up" className="text-primary font-semibold hover:underline transition-colors duration-150 ease-out">
                                Request Now
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
