"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { bootstrapRbacForActiveOrg } from "../../_actions/rbac";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";
import { Loader2, MapPin } from "lucide-react";

const teamSchema = z.object({
    name: z.string().min(2, "Nama cabang minimal 2 karakter").max(60, "Nama cabang maksimal 60 karakter"),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamOnboardingFormProps {
    organizationId?: string;
}

export function TeamOnboardingForm({ organizationId }: TeamOnboardingFormProps) {
    const { push, refresh } = useTransitionRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: {
            name: "",
        },
    });

    async function onSubmit(values: TeamFormValues) {
        setIsLoading(true);
        try {
            const payload: { name: string; organizationId?: string } = {
                name: values.name,
            };

            if (organizationId) {
                payload.organizationId = organizationId;
            }

            const { data, error } = await authClient.organization.createTeam(payload);

            if (error) {
                toast.error(error.message || "Gagal membuat cabang. Silakan coba lagi.");
                return;
            }

            const teamId = (data as any)?.team?.id ?? (data as any)?.id;
            if (teamId) {
                await authClient.organization.setActiveTeam({
                    teamId,
                });
            }

            const bootstrapResult = await bootstrapRbacForActiveOrg();
            if (!bootstrapResult.ok) {
                toast.error("Role akses belum tersinkron. Silakan refresh setelah onboarding.");
            }

            toast.success("Cabang usaha berhasil dibuat!");
            push("/dashboard");
            refresh();
        } catch (error) {
            toast.error("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="border-border">
            <CardHeader>
                <CardTitle className="text-xl">Informasi Cabang Pertama</CardTitle>
                <CardDescription>
                    Cabang ini akan digunakan untuk mengelola operasional lokasi pertamamu
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Cabang Usaha</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Contoh: Indomaret Setia Budi Medan"
                                                disabled={isLoading}
                                                className="pl-9"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sedang Memproses...
                                </>
                            ) : (
                                "Buat Cabang Pertama"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
