"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Card, CardContent } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { 
  ArrowLeft, 
  Pencil, 
  Package, 
  Star, 
  TrendingUp, 
  MapPin, 
  Truck, 
  Clock,
  Share2,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatRupiah, cn } from "@/lib/utils";
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
  // Mock data untuk design
  rating?: number;
  reviewCount?: number;
  colors?: string[];
  sizes?: string[];
};

type ProductDetailClientProps = {
  product: ProductDetail;
  categories: ProductCategory[];
  suppliers: Supplier[];
};

// Mock data untuk design
const MOCK_DATA = {
  rating: 4.5,
  reviewCount: 128,
  colors: ["#1a1a1a", "#8B4513", "#2F4F4F", "#D2691E", "#000080"],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
};

function ImageGallery({ images, mainImage, productName }: { images: string[]; mainImage: string | null; productName: string }) {
  const allImages = mainImage ? [mainImage, ...images.filter(img => img !== mainImage)] : images;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageError, setImageError] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setImageError(prev => new Set([...prev, index]));
  };

  const currentImage = allImages[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
        {currentImage && !imageError.has(selectedIndex) ? (
          <Image
            src={currentImage}
            alt={productName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
            priority
            unoptimized={currentImage.includes("cloudinary")}
            onError={() => handleImageError(selectedIndex)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-20 w-20 text-gray-300" />
          </div>
        )}
        
        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSelectedIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg hover:bg-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                selectedIndex === idx 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "border-border/60 hover:border-primary/50"
              )}
            >
              {!imageError.has(idx) ? (
                <Image
                  src={img}
                  alt={`${productName} - ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={img.includes("cloudinary")}
                  onError={() => handleImageError(idx)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorSwatch({ color, isSelected, onClick }: { color: string; isSelected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
      style={{ backgroundColor: color }}
    >
      {isSelected && <div className="w-3 h-3 rounded-full bg-white shadow-sm" />}
    </button>
  );
}

function SizeButton({ size, isSelected, isAvailable, onClick }: { 
  size: string; 
  isSelected?: boolean; 
  isAvailable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        "min-w-[48px] h-10 px-3 rounded-lg border text-sm font-medium transition-all",
        isSelected 
          ? "border-primary bg-primary text-primary-foreground" 
          : isAvailable
            ? "border-border hover:border-primary/50 hover:bg-muted"
            : "border-border/30 text-muted-foreground bg-muted/50 cursor-not-allowed"
      )}
    >
      {size}
    </button>
  );
}

export function ProductDetailClient({ product, categories, suppliers }: ProductDetailClientProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2); // Default M
  const [isLiked, setIsLiked] = useState(false);

  // Merge dengan mock data untuk design
  const displayProduct = {
    ...product,
    ...MOCK_DATA,
  };

  const handleUpdateProduct = async (data: UpdateProductInput) => {
    await updateProductAction(product.id, data);
    toast.success("Produk berhasil diupdate");
    window.location.reload();
  };

  const profitMargin = product.pricing.costPrice && product.pricing.salePrice
    ? Math.round(((product.pricing.salePrice - product.pricing.costPrice) / product.pricing.salePrice) * 100)
    : null;

  const hasDiscount = product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground transition-colors">
          Produk
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Images */}
        <div>
          <ImageGallery 
            images={product.media.images} 
            mainImage={product.media.imageUrl}
            productName={product.name}
          />
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.isFeatured && (
                <Badge className="bg-amber-500 text-white border-0">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Unggulan
                </Badge>
              )}
              {product.category && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}
              {!product.isActive && (
                <Badge variant="outline" className="text-muted-foreground">Nonaktif</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "w-5 h-5",
                        i < Math.floor(displayProduct.rating || 0) 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold ml-1">{displayProduct.rating}</span>
              </div>
              <span className="text-muted-foreground">
                ({displayProduct.reviewCount} reviews)
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-muted-foreground">
                {product.soldCount} terjual
              </span>
            </div>
          </div>

          {/* Price */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-foreground">
                  {formatRupiah(product.pricing.salePrice || product.pricing.basePrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatRupiah(product.pricing.basePrice)}
                    </span>
                    <Badge className="bg-red-500 text-white">
                      -{Math.round((1 - (product.pricing.salePrice! / product.pricing.basePrice)) * 100)}%
                    </Badge>
                  </>
                )}
              </div>
              {profitMargin !== null && product.pricing.costPrice && (
                <p className="text-sm text-muted-foreground mt-2">
                  Modal: {formatRupiah(product.pricing.costPrice)} • Margin: {profitMargin}%
                </p>
              )}
            </CardContent>
          </Card>

          {/* Colors (Mock) */}
          {displayProduct.colors && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Warna Tersedia</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {displayProduct.colors.map((color, idx) => (
                  <ColorSwatch
                    key={idx}
                    color={color}
                    isSelected={selectedColor === idx}
                    onClick={() => setSelectedColor(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes (Mock) */}
          {displayProduct.sizes && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Ukuran</span>
                {product.stock && product.stock.totalQuantity <= 10 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    Hanya {product.stock.totalQuantity} stok tersisa
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {displayProduct.sizes.map((size, idx) => (
                  <SizeButton
                    key={idx}
                    size={size}
                    isSelected={selectedSize === idx}
                    isAvailable={idx !== 5} // Mock: XXL unavailable
                    onClick={() => setSelectedSize(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stock Info */}
          {product.stock && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Stok Tersedia</p>
                <p className="text-sm text-muted-foreground">
                  {product.stock.totalQuantity} unit di {product.stock.byBranch.length} cabang
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 h-12 text-base font-semibold" 
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Produk
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Shipping Info (Mock) */}
          <div className="grid grid-cols-3 gap-4 p-4 border rounded-xl">
            <div className="text-center">
              <Truck className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-medium">Gratis Ongkir</p>
              <p className="text-xs text-muted-foreground">Min. Rp100k</p>
            </div>
            <div className="text-center border-x">
              <Clock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-medium">Pengiriman</p>
              <p className="text-xs text-muted-foreground">1-3 hari</p>
            </div>
            <div className="text-center">
              <MapPin className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs font-medium">Dikirim dari</p>
              <p className="text-xs text-muted-foreground">Jakarta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-12">
        <Tabs defaultValue="description" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="description" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Deskripsi
            </TabsTrigger>
            <TabsTrigger 
              value="stock"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Stok & Cabang
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              Reviews ({displayProduct.reviewCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-6">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {product.description ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Tidak ada deskripsi</p>
                )}

                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Spesifikasi</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">SKU</p>
                      <p className="font-medium">{product.sku || "-"}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Barcode</p>
                      <p className="font-medium">{product.barcode || "-"}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Berat</p>
                      <p className="font-medium">{product.physical.weight ? `${product.physical.weight}g` : "-"}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Kategori</p>
                      <p className="font-medium">{product.category?.name || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Card */}
              <div>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold">Informasi Pemasok</h3>
                    {product.supplier ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {product.supplier.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{product.supplier.name}</p>
                            <p className="text-sm text-muted-foreground">Pemasok Terverifikasi</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Produk</span>
                            <span className="font-medium">24</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bergabung</span>
                            <span className="font-medium">Jan 2024</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Tidak ada informasi pemasok</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock">
            <div className="space-y-6">
              <h3 className="font-semibold">Stok per Cabang</h3>
              {product.stock ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {product.stock.byBranch.map((branch) => (
                    <Card key={branch.branchId}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{branch.branchName}</p>
                          <p className="text-sm text-muted-foreground">Tersedia</p>
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-sm font-semibold",
                          branch.quantity === 0 ? "bg-red-100 text-red-700" :
                          branch.quantity <= 10 ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {branch.quantity}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak terhubung ke inventory</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Fitur review akan segera hadir</p>
            </div>
          </TabsContent>
        </Tabs>
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
