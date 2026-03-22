"use client";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn, formatRupiah } from "@/lib/utils";
import { Package, MoreHorizontal, Pencil, Trash2, Copy, Barcode, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export type Product = {
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
};

type ProductCardProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
};

function StockBadge({ status, quantity }: { status: string; quantity: number | null }) {
  const variants: Record<string, { variant: any; label: string; className: string }> = {
    ok: {
      variant: "outline" as const,
      label: quantity !== null ? `Stok: ${quantity}` : "Stok tersedia",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    low: {
      variant: "outline" as const,
      label: quantity !== null ? `Stok: ${quantity}` : "Stok rendah",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    out: {
      variant: "outline" as const,
      label: "Stok habis",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    unknown: {
      variant: "outline" as const,
      label: "Stok: -",
      className: "bg-muted/50 text-muted-foreground",
    },
  };

  const config = variants[status] || variants.unknown;

  return (
    <Badge variant={config.variant} className={cn("text-[10px] font-semibold px-1.5 py-0 h-5", config.className)}>
      {config.label}
    </Badge>
  );
}

export function ProductCard({ product, onEdit, onDelete, onDuplicate }: ProductCardProps) {
  const router = useRouter();
  const displayPrice = product.pricing.salePrice || product.pricing.basePrice;

  return (
    <div 
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 space-y-4 transition-all cursor-pointer hover:border-primary/50 hover:shadow-sm",
        !product.isActive && "opacity-60"
      )}
      onClick={(e) => {
        // Don't navigate if clicking on dropdown or buttons
        if ((e.target as HTMLElement).closest('button')) return;
        router.push(`/products/${product.id}`);
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Image */}
        <div className="relative h-16 w-16 rounded-lg border border-border/60 bg-muted flex-shrink-0 overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized={product.imageUrl.includes('cloudinary')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground text-sm truncate pr-2">
              {product.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Produk
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(product)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplikat
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(product)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* SKU & Category */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {product.sku && (
              <span className="flex items-center gap-1">
                <Barcode className="h-3 w-3" />
                {product.sku}
              </span>
            )}
            {product.category && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {product.category.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Price & Stock */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground">
            {formatRupiah(displayPrice)}
          </p>
          {product.pricing.costPrice && (
            <p className="text-[10px] text-muted-foreground">
              Modal: {formatRupiah(product.pricing.costPrice)}
            </p>
          )}
        </div>
        <StockBadge status={product.stock.status} quantity={product.stock.quantity} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          {!product.isActive && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
              Nonaktif
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
              Unggulan
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          Terjual: {product.soldCount}
        </span>
      </div>
    </div>
  );
}
