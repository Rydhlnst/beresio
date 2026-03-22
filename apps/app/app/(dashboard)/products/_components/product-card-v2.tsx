"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { cn, formatRupiah } from "@/lib/utils";
import { Star, ShoppingCart, ExternalLink, Package, TrendingUp } from "lucide-react";

export type ProductV2 = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  pricing: {
    basePrice: number;
    salePrice: number | null;
    costPrice: number | null;
  };
  stock: {
    quantity: number | null;
    status: string;
  };
  imageUrl: string | null;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  soldCount: number;
  rating?: number;
  reviewCount?: number;
  category: {
    id: string;
    name: string;
  } | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  tags?: string[];
  createdAt: string;
};

type ProductCardV2Props = {
  product: ProductV2;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onQuickView?: (product: ProductV2) => void;
  showCheckbox?: boolean;
};

function StockBadge({ quantity, status }: { quantity: number | null; status: string }) {
  if (status === "out" || quantity === 0) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
        Habis
      </Badge>
    );
  }
  if (status === "low" || (quantity && quantity <= 10)) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
        Stok: {quantity}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
      Stok: {quantity}
    </Badge>
  );
}

export function ProductCardV2({
  product,
  isSelected,
  onSelect,
  onQuickView,
  showCheckbox = false,
}: ProductCardV2Props) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  
  const displayPrice = product.pricing.salePrice || product.pricing.basePrice;
  const hasDiscount = product.pricing.salePrice && product.pricing.salePrice < product.pricing.basePrice;

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border border-border/60 overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1",
        !product.isActive && "opacity-60 grayscale",
        isSelected && "ring-2 ring-primary border-primary"
      )}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="h-5 w-5 border-2 bg-white/90 backdrop-blur-sm"
          />
        </div>
      )}

      {/* Featured Badge */}
      {product.isFeatured && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-amber-500 text-white border-0 text-[10px] font-semibold px-2">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Unggulan
          </Badge>
        </div>
      )}

      {/* Image Container */}
      <div 
        className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden cursor-pointer"
        onClick={() => router.push(`/products/${product.id}`)}
      >
        {product.imageUrl && !imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={product.imageUrl.includes("cloudinary")}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

        {/* Quick Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            className="flex-1 h-9 text-xs font-medium bg-white text-foreground hover:bg-white/90 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/products/${product.id}`);
            }}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Detail
          </Button>
          {onQuickView && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-9 p-0 bg-white/90 backdrop-blur-sm border-0 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category / Supplier Badge */}
        <div className="flex items-center gap-2">
          {product.category && (
            <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 h-5">
              {product.category.name}
            </Badge>
          )}
          <StockBadge quantity={product.stock.quantity} status={product.stock.status} />
        </div>

        {/* Title */}
        <h3 
          className="font-semibold text-foreground text-sm line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors"
          onClick={() => router.push(`/products/${product.id}`)}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {(product.rating || product.soldCount > 0) && (
          <div className="flex items-center gap-3 text-xs">
            {product.rating && (
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium ml-1">{product.rating.toFixed(1)}</span>
                </div>
                {product.reviewCount && (
                  <span className="text-muted-foreground">({product.reviewCount})</span>
                )}
              </div>
            )}
            {product.soldCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Terjual {product.soldCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatRupiah(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatRupiah(product.pricing.basePrice)}
            </span>
          )}
        </div>

        {/* Tags / Meta */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {product.supplier && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {product.supplier.name}
            </span>
          )}
          {product.sku && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              SKU: {product.sku}
            </span>
          )}
          {product.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
