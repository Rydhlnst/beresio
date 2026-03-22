"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { normalizeBusinessType } from "@/lib/business-type";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { bootstrapRbacForActiveOrg } from "@/app/onboarding/_actions/rbac";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import { Loader2, Building2, Store, Pizza, Coffee, Shirt, User } from "lucide-react";

const orgSchema = z.object({
    name: z.string().min(3, "Nama bisnis minimal 3 karakter").max(50, "Nama bisnis maksimal 50 karakter"),
    businessType: z.string({
        required_error: "Pilih tipe bisnis kamu",
    }),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const BUSINESS_TYPES = [
    { value: "laundry", label: "Laundry", icon: Shirt },
    { value: "caffe", label: "Cafe & Resto", icon: Coffee },
    { value: "retail", label: "Retail / Toko", icon: Store },
    { value: "food", label: "Makanan & Minuman", icon: Pizza },
    { value: "service", label: "Jasa", icon: User },
    { value: "other", label: "Lainnya", icon: Building2 },
];

export function CreateOrgForm() {
    const { push, refresh } = useTransitionRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<OrgFormValues>({
        resolver: zodResolver(orgSchema),
        defaultValues: {
            name: "",
            businessType: "",
        },
    });

    async function onSubmit(values: OrgFormValues) {
        setIsLoading(true);
        try {
            const { data, error } = await authClient.organization.create({
                name: values.name,
                slug: values.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                businessType: normalizeBusinessType(values.businessType),
            });

            if (error) {
                toast.error(error.message || "Gagal membuat organisasi. Silakan coba lagi.");
                return;
            }

            const orgId = (data as any)?.organization?.id ?? (data as any)?.id;
            if (orgId) {
                await authClient.organization.setActiveOrganization({
                    organizationId: orgId,
                });
            }

            const bootstrapResult = await bootstrapRbacForActiveOrg();
            if (!bootstrapResult.ok) {
                toast.error("Role akses belum tersinkron. Silakan refresh halaman.");
            }

            toast.success("Organisasi baru berhasil dibuat!");
            
            // Redirect to dashboard after creating additional org
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
                <CardTitle className="text-xl">Informasi Bisnis</CardTitle>
                <CardDescription>
                    Masukkan detail untuk organisasi baru kamu
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
                                    <FormLabel>Nama Organisasi</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Contoh: Indomaret Cabang 2"
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
                            name="businessType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipe Bisnis</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih tipe bisnis" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {BUSINESS_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div className="flex items-center gap-2">
                                                        <type.icon className="w-4 h-4 text-muted-foreground" />
                                                        <span>{type.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                disabled={isLoading}
                                onClick={() => push("/dashboard")}
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    "Buat Organisasi"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
