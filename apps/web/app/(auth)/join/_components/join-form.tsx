"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@repo/ui/form";
import { Loader2 } from "lucide-react";

const joinSchema = z.object({
    code: z.string().length(6, "Kode undangan harus 6 karakter")
        .regex(/^[A-Z0-9]+$/, "Hanya huruf besar dan angka"),
});

type JoinFormValues = z.infer<typeof joinSchema>;

interface JoinFormProps {
    initialToken?: string;
}

export function JoinForm({ initialToken }: JoinFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [autoAccepting, setAutoAccepting] = useState(!!initialToken);

    const form = useForm<JoinFormValues>({
        resolver: zodResolver(joinSchema),
        defaultValues: {
            code: "",
        },
    });

    useEffect(() => {
        async function acceptInvite() {
            if (!initialToken) return;

            try {
                const { error } = await authClient.organization.acceptInvitation({
                    invitationId: initialToken
                });

                if (error) {
                    toast.error("Kode atau link undangan tidak valid atau sudah kadaluarsa");
                    setAutoAccepting(false);
                    return;
                }

                toast.success("Berhasil bergabung ke bisnis!");
                router.push("/dashboard");
            } catch (error) {
                toast.error("Terjadi kesalahan. Coba lagi.");
                setAutoAccepting(false);
            }
        }

        if (initialToken) {
            acceptInvite();
        }
    }, [initialToken, router]);

    async function onSubmit(values: JoinFormValues) {
        setIsLoading(true);
        try {
            const { error } = await authClient.organization.acceptInvitation({
                invitationId: values.code,
            });

            if (error) {
                toast.error("Kode undangan tidak valid atau sudah kadaluarsa");
                return;
            }

            toast.success("Berhasil bergabung ke bisnis!");
            router.push("/dashboard");
        } catch {
            toast.error("Terjadi kesalahan. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    }

    if (autoAccepting) {
        return (
            <Card className="w-full border-border shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                    <p className="text-muted-foreground">Menerima undangan...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full border-border shadow-sm">
            <CardHeader className="space-y-1 pb-4 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Masukkan Kode Undangan</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field: { onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="X7Y9Z1"
                                            autoComplete="off"
                                            disabled={isLoading}
                                            className="text-center text-2xl tracking-[0.2em] uppercase"
                                            {...fieldProps}
                                            onChange={(e) => {
                                                e.target.value = e.target.value.toUpperCase();
                                                onChange(e);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Memproses..." : "Bergabung"}
                        </Button>
                    </form>
                </Form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 justify-center pb-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Belum punya kode? Minta ke pemilik bisnis kamu
                </p>
                <Link
                    href="/welcome"
                    className="text-sm font-medium text-brand hover:underline underline-offset-4"
                >
                    Kembali
                </Link>
            </CardFooter>
        </Card>
    );
}
