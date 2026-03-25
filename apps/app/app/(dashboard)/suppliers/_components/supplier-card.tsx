"use client";

import { Supplier } from "../_actions/suppliers";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SupplierCardProps {
  supplier: Supplier;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
}

export function SupplierCard({ supplier, onEdit, onDelete }: SupplierCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {supplier.name}
              </h3>
              {supplier.code && (
                <p className="text-xs text-muted-foreground">{supplier.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={supplier.isActive ? "default" : "secondary"}
              className={cn(
                "text-xs",
                supplier.isActive
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-100"
              )}
            >
              {supplier.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/suppliers/${supplier.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Detail
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(supplier)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(supplier)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Contact Info */}
          <div className="flex flex-wrap gap-3 text-sm">
            {supplier.contactName && (
              <span className="text-muted-foreground">
                {supplier.contactName}
              </span>
            )}
          </div>

          {/* Contact Details */}
          <div className="flex flex-wrap gap-3">
            {supplier.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate max-w-[120px]">{supplier.email}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {(supplier.city || supplier.address) && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {supplier.address}
                {supplier.address && supplier.city && ", "}
                {supplier.city}
                {supplier.city && supplier.province && ", "}
                {supplier.province}
              </span>
            </div>
          )}

          {/* Product Count */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
            <Package className="h-3.5 w-3.5" />
            <span>{supplier.productCount || 0} produk</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
