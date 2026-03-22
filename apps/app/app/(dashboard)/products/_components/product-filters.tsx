"use client";

import { useState, useCallback, useTransition } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Badge } from "@repo/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCategory, Supplier } from "../_actions/products";

export type FilterState = {
  search: string;
  categoryId: string;
  supplierId: string;
  status: string;
  stockStatus: string;
};

type ProductFiltersProps = {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: ProductCategory[];
  suppliers: Supplier[];
};

export function ProductFilters({
  filters,
  onFilterChange,
  categories,
  suppliers,
}: ProductFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [localSearch, setLocalSearch] = useState(filters.search);

  const activeFiltersCount = [
    filters.categoryId,
    filters.supplierId,
    filters.status,
    filters.stockStatus,
  ].filter(Boolean).length;

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    startTransition(() => {
      onFilterChange({ ...filters, search: value });
    });
  }, [filters, onFilterChange]);

  const handleClearFilters = () => {
    setLocalSearch("");
    onFilterChange({
      search: "",
      categoryId: "",
      supplierId: "",
      status: "",
      stockStatus: "",
    });
  };

  const hasActiveFilters = localSearch || activeFiltersCount > 0;

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari produk, SKU, atau barcode..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn(
              "pl-9 h-9",
              isPending && "opacity-70"
            )}
          />
          {localSearch && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select
            value={filters.categoryId || "all"}
            onValueChange={(value) =>
              onFilterChange({ ...filters, categoryId: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-9 w-[140px] text-xs">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stock Status Filter */}
          <Select
            value={filters.stockStatus || "all"}
            onValueChange={(value) =>
              onFilterChange({ ...filters, stockStatus: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue placeholder="Status Stok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Stok</SelectItem>
              <SelectItem value="ok">Tersedia</SelectItem>
              <SelectItem value="low">Stok Rendah</SelectItem>
              <SelectItem value="out">Habis</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFilterChange({ ...filters, status: value === "all" ? "" : value })
            }
          >
            <SelectTrigger className="h-9 w-[120px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 text-xs text-muted-foreground"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter aktif:</span>
          {filters.categoryId && (
            <Badge variant="secondary" className="text-xs px-2 py-0 h-6">
              Kategori: {categories.find((c) => c.id === filters.categoryId)?.name}
              <button
                onClick={() => onFilterChange({ ...filters, categoryId: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.stockStatus && (
            <Badge variant="secondary" className="text-xs px-2 py-0 h-6">
              Stok: {filters.stockStatus === "ok" ? "Tersedia" : filters.stockStatus === "low" ? "Rendah" : "Habis"}
              <button
                onClick={() => onFilterChange({ ...filters, stockStatus: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="text-xs px-2 py-0 h-6">
              Status: {filters.status === "active" ? "Aktif" : "Nonaktif"}
              <button
                onClick={() => onFilterChange({ ...filters, status: "" })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
