"use client";

import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterState = {
  search: string;
  status: string;
  city: string;
};

interface SupplierFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  cities: string[];
}

export function SupplierFilters({
  filters,
  onFilterChange,
  cities,
}: SupplierFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({ ...filters, status: value });
  };

  const handleCityChange = (value: string) => {
    onFilterChange({ ...filters, city: value });
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 flex-1">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari pemasok..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 pl-9 text-sm"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground lg:hidden" />
        
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Select value={filters.city} onValueChange={handleCityChange}>
          <SelectTrigger className="h-9 w-[150px] text-xs">
            <SelectValue placeholder="Kota" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Kota</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
