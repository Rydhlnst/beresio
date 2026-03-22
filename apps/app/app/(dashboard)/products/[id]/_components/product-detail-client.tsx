"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { ArrowLeft, Pencil, Package, TrendingUp, History, Barcode, Weight, Box } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ProductFormDialog } from "../../_components/product-form-dialog";
import { updateProductAction, UpdateProductInput, ProductCategory, Supplier } from "../../_actions/products";
import { toast } from "sonner";

type ProductDetail = {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    slug: string | null;
    description: string | null;
    shortDescription: string | null;
    pricing: {
        basePrice: number;
        salePrice: number | null;
        costPrice: number | null;
    };
    physical: {
        weight: number | null;
        dimensions: {
            length?: number;
            width?: number;
            height?: number;
        };
    };
    media: {
        imageUrl: string | null;
        images: string[];
    };
    seo: {
        metaTitle: string | null;
        metaDescription: string | null;
    };
    stock: {
        totalQuantity: number;
        byBranch: Array<{
            branchId: string;
            branchName: string;
            quantity: number;
        }>;
    } | null;
    isActive: boolean;
    isFeatured: boolean;
    soldCount: number;
    category: {
        id: string;
        name: string;
    } | null;
    supplier: {
        id: string;
        name: string;
    } | null;
    createdAt: string;
    updatedAt: string;
};

type ProductDetailClientProps = {
    product: ProductDetail;
    categories: ProductCategory[];
    suppliers: Supplier[];
};

function StockStatusBadge({ quantity }: { quantity: number }) {
    if (quantity === 0) {
        return <Badge variant="destructive">Habis</Badge>;
    }
    if (quantity <= 10) {
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Stok Rendah ({quantity})</Badge>;
    }
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Tersedia ({quantity})</Badge>;
}

export function ProductDetailClient({ product, categories, suppliers }: ProductDetailClientProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleUpdateProduct = async (data: UpdateProductInput) => {
        await updateProductAction(product.id, data);
        toast.success("Produk berhasil diupdate");
        // Refresh page to get updated data
        window.location.reload();
    };

    const profitMargin = product.pricing.costPrice && product.pricing.salePrice
        ? Math.round(((product.pricing.salePrice - product.pricing.costPrice) / product.pricing.salePrice) * 100)
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href="/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-foreground">{product.name}</h1>
                            {!product.isActive && (
                                <Badge variant="secondary">Nonaktif</Badge>
                            )}
                            {product.isFeatured && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Unggulan</Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {product.sku && `SKU: ${product.sku}`}
                            {product.sku && product.barcode && " • "}
                            {product.barcode && `Barcode: ${product.barcode}`}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setIsEditDialogOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Produk
                </Button>
            </div>

            {/* Main Content */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Image & Quick Info */}
                <div className="space-y-6">
                    {/* Image Card */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="relative aspect-square rounded-lg border border-border/60 bg-muted overflow-hidden">
                                {product.media.imageUrl ? (
                                    <Image
                                        src={product.media.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                        unoptimized={product.media.imageUrl.includes('cloudinary')}
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Package className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Box className="h-4 w-4" />
                                Status Stok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {product.stock ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Total Stok</span>
                                        <StockStatusBadge quantity={product.stock.totalQuantity} />
                                    </div>
                                    <div className="space-y-2">
                                        {product.stock.byBranch.map((branch) => (
                                            <div key={branch.branchId} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{branch.branchName}</span>
                                                <span className="font-medium">{branch.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak terhubung ke inventory</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="pricing">Harga</TabsTrigger>
                            <TabsTrigger value="history">Riwayat</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Dasar</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Kategori</p>
                                            <p className="font-medium">{product.category?.name || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Pemasok</p>
                                            <p className="font-medium">{product.supplier?.name || "-"}</p>
                                        </div>
                                        {product.barcode && (
                                            <div className="flex items-center gap-2">
                                                <Barcode className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Barcode</p>
                                                    <p className="font-medium">{product.barcode}</p>
                                                </div>
                                            </div>
                                        )}
                                        {product.physical.weight && (
                                            <div className="flex items-center gap-2">
                                                <Weight className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Berat</p>
                                                    <p className="font-medium">{product.physical.weight}g</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {product.description && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-muted-foreground mb-2">Deskripsi</p>
                                            <p className="text-sm whitespace-pre-wrap">{product.description}</p>
                                        </div>
                                    )}

                                    {product.shortDescription && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm text-muted-foreground mb-2">Deskripsi Singkat</p>
                                            <p className="text-sm">{product.shortDescription}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* SEO Info */}
                            {(product.seo.metaTitle || product.seo.metaDescription) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>SEO / Meta</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {product.seo.metaTitle && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Meta Title</p>
                                                <p className="font-medium">{product.seo.metaTitle}</p>
                                            </div>
                                        )}
                                        {product.seo.metaDescription && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Meta Description</p>
                                                <p className="text-sm">{product.seo.metaDescription}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Pricing Tab */}
                        <TabsContent value="pricing" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Informasi Harga
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-3">
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-sm text-muted-foreground">Harga Dasar</p>
                                            <p className="text-2xl font-bold">{formatRupiah(product.pricing.basePrice)}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-sm text-muted-foreground">Harga Jual</p>
                                            <p className="text-2xl font-bold text-emerald-600">
                                                {formatRupiah(product.pricing.salePrice || product.pricing.basePrice)}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <p className="text-sm text-muted-foreground">Harga Modal</p>
                                            <p className="text-2xl font-bold">
                                                {product.pricing.costPrice ? formatRupiah(product.pricing.costPrice) : "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {profitMargin !== null && (
                                        <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-emerald-700">Margin Keuntungan</p>
                                                    <p className="text-2xl font-bold text-emerald-700">{profitMargin}%</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-emerald-700">Keuntungan per unit</p>
                                                    <p className="font-semibold text-emerald-700">
                                                        {formatRupiah((product.pricing.salePrice || product.pricing.basePrice) - (product.pricing.costPrice || 0))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Sales Stats */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Statistik Penjualan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-full bg-primary/10">
                                                <Package className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Terjual</p>
                                                <p className="text-xl font-bold">{product.soldCount} unit</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-full bg-primary/10">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                                <p className="text-xl font-bold">
                                                    {formatRupiah(product.soldCount * (product.pricing.salePrice || product.pricing.basePrice))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* History Tab */}
                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="h-5 w-5" />
                                        Riwayat Aktivitas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3 pb-4 border-b">
                                            <div className="p-2 rounded-full bg-muted">
                                                <Pencil className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">Produk dibuat</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(product.createdAt).toLocaleDateString('id-ID', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {product.createdAt !== product.updatedAt && (
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-full bg-muted">
                                                    <Pencil className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">Terakhir diupdate</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(product.updatedAt).toLocaleDateString('id-ID', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Edit Dialog */}
            <ProductFormDialog
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSubmit={handleUpdateProduct}
                initialData={{
                    id: product.id,
                    name: product.name,
                    sku: product.sku || undefined,
                    barcode: product.barcode || undefined,
                    categoryId: product.category?.id,
                    supplierId: product.supplier?.id,
                    basePrice: product.pricing.basePrice,
                    salePrice: product.pricing.salePrice || undefined,
                    costPrice: product.pricing.costPrice || undefined,
                    description: product.description || undefined,
                    shortDescription: product.shortDescription || undefined,
                    weight: product.physical.weight || undefined,
                    imageUrl: product.media.imageUrl || undefined,
                    isActive: product.isActive,
                    isFeatured: product.isFeatured,
                }}
                categories={categories}
                suppliers={suppliers}
                mode="edit"
            />
        </div>
    );
}
