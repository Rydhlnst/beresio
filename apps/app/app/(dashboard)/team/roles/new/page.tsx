"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { createRoleAction } from "../../actions";
import { useState } from "react";

const roleSchema = z.object({
    name: z.string().min(1, "Nama role wajib diisi"),
    slug: z.string().optional(),
    description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export default function RoleNewPage() {
    const router = useTransitionRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            name: "",
            slug: "",
            description: "",
        } as RoleFormValues,
        onSubmit: async ({ value }) => {
            const parsed = roleSchema.safeParse(value);
            if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Form tidak valid.");
                return;
            }

            setIsSubmitting(true);
            const result = await createRoleAction({
                name: parsed.data.name,
                slug: parsed.data.slug || undefined,
                description: parsed.data.description,
            });
            setIsSubmitting(false);

            if (!result.ok) {
                toast.error(result.error || "Gagal membuat role.");
                return;
            }

            toast.success("Role berhasil dibuat!");
            router.push("/tim/roles");
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Buat Role Baru</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Buat role khusus sesuai kebutuhan organisasi.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/tim/roles">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Informasi Role" description="Nama dan deskripsi role.">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.handleSubmit();
                    }}
                    className="space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <form.Field name="name">
                            {(field) => (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Role *</label>
                                    <Input
                                        placeholder="Contoh: Supervisor"
                                        value={field.state.value}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                    />
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="slug">
                            {(field) => (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slug (Opsional)</label>
                                    <Input
                                        placeholder="supervisor"
                                        value={field.state.value}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Dibuat otomatis dari nama jika kosong.
                                    </p>
                                </div>
                            )}
                        </form.Field>
                    </div>
                    <form.Field name="description">
                        {(field) => (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Deskripsi</label>
                                <Input
                                    placeholder="Deskripsi singkat tentang role ini"
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                />
                            </div>
                        )}
                    </form.Field>
                    <Button 
                        className="h-9 text-xs font-semibold" 
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Menyimpan..." : "Simpan Role"}
                    </Button>
                </form>
            </SectionCard>
        </div>
    );
}
