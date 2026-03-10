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
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { signUp } from "@/lib/auth-client";

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
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
                router.push("/");
                router.refresh();
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        window.location.href = "/api/auth/login/google";
    };

    return (
        <div className="w-full space-y-8">
            <div className="space-y-4">
                <Heading as="h1" className="text-4xl font-bold tracking-tight text-foreground leading-[1.2]">
                    Create Account
                </Heading>
                <Text className="text-muted-foreground font-medium text-base">
                    Join us and start managing your workflows
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
                                            Full Name
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                                                <Input
                                                    {...field}
                                                    placeholder="Enter your full name"
                                                    type="text"
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-white border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium shadow-none"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-destructive pl-1" />
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
                                                    placeholder="Enter your email"
                                                    type="email"
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-white border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium shadow-none"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-destructive pl-1" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-sm font-semibold text-foreground/80">
                                            Create Password
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                                <Input
                                                    {...field}
                                                    placeholder="••••••••"
                                                    type={showPassword ? "text" : "password"}
                                                    disabled={isLoading}
                                                    className="h-12 pl-12 bg-white border-input rounded-xl text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium pr-12 shadow-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/40 hover:text-foreground transition-colors"
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold text-destructive pl-1" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all border-none shadow-none"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign up"}
                        </Button>
                    </form>
                </Form>

                <div className="space-y-6">
                    <div className="relative flex items-center gap-4 py-2">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-[11px] font-bold tracking-wider text-muted-foreground/40 uppercase">OR</span>
                        <div className="flex-1 border-t border-border" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <GoogleOAuthButton
                            onClick={handleGoogleSignIn}
                            isLoading={isLoading}
                            disabled={isLoading}
                            label="Sign up with Google"
                            className="w-full h-12 rounded-xl bg-white hover:bg-muted/50 border border-input transition-all flex items-center justify-center gap-3 px-6 shadow-none"
                        />
                    </div>

                    <div className="text-center pt-2">
                        <Text align="center" className="text-sm font-medium text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/sign-in" className="text-primary font-bold hover:underline transition-all">
                                Login Now
                            </Link>
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
