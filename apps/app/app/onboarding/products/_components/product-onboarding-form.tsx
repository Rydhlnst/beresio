"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createProductAction } from "@/app/(dashboard)/products/_actions/products";
import { updateOnboardingMetadataAction } from "@/app/onboarding/_actions/organization";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

type ProductDraft = {
    id: string;
    name: string;
    price: string;
    category: string;
};

function createDraft(): ProductDraft {
    return {
        id: crypto.randomUUID(),
        name: "",
        price: "",
        category: "",
    };
}

function parsePrice(value: string) {
    const normalized = value.replace(/[^\d]/g, "");
    return Number(normalized || 0);
}

export function ProductOnboardingForm() {
    const { replace } = useTransitionRouter();
    const [products, setProducts] = useState<ProductDraft[]>(() => [createDraft()]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updateProduct = (id: string, patch: Partial<ProductDraft>) => {
        setProducts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    const removeProduct = (id: string) => {
        setProducts((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
    };

    const markStep = async (patch: Record<string, unknown>) => {
        const result = await updateOnboardingMetadataAction(patch);
        if (!result.ok) {
            toast.error(result.error);
            return false;
        }
        return true;
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        try {
            const ok = await markStep({
                productStepSkipped: true,
                productStepSkippedAt: new Date().toISOString(),
            });
            if (ok) replace("/onboarding/team");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        const validProducts = products
            .map((item) => ({
                ...item,
                name: item.name.trim(),
                category: item.category.trim(),
                price: parsePrice(item.price),
            }))
            .filter((item) => item.name.length > 0 || item.price > 0 || item.category.length > 0);

        if (validProducts.length === 0) {
            toast.error("Isi minimal satu produk atau pilih Lewati dulu.");
            return;
        }

        const invalid = validProducts.find((item) => item.name.length < 2 || item.price <= 0 || item.category.length < 2);
        if (invalid) {
            toast.error("Nama, harga, dan kategori wajib diisi untuk setiap produk.");
            return;
        }

        setIsSubmitting(true);
        try {
            for (const item of validProducts) {
                await createProductAction({
                    name: item.name,
                    basePrice: item.price,
                    salePrice: item.price,
                    shortDescription: `Kategori awal: ${item.category}`,
                    isActive: true,
                });
            }

            const ok = await markStep({
                productStepCompleted: true,
                productStepCompletedAt: new Date().toISOString(),
                productStepSkipped: false,
            });
            if (!ok) return;

            toast.success("Produk awal berhasil ditambahkan.");
            replace("/onboarding/team");
        } catch {
            toast.error("Gagal menambahkan produk. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="space-y-3">
                {products.map((product, index) => (
                    <div key={product.id} className="grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1.3fr_0.8fr_1fr_auto]">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Nama</p>
                            <Input
                                placeholder={index === 0 ? "Kopi Susu Aren" : "Nama produk"}
                                value={product.name}
                                onChange={(event) => updateProduct(product.id, { name: event.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Harga</p>
                            <Input
                                inputMode="numeric"
                                placeholder="25000"
                                value={product.price}
                                onChange={(event) => updateProduct(product.id, { price: event.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Kategori</p>
                            <Input
                                placeholder="Minuman"
                                value={product.category}
                                onChange={(event) => updateProduct(product.id, { category: event.target.value })}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeProduct(product.id)}
                                disabled={isSubmitting || products.length === 1}
                                aria-label="Hapus produk"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProducts((current) => [...current, createDraft()])}
                    disabled={isSubmitting}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah lagi
                </Button>

                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                        Lewati dulu
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            "Lanjutkan"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
