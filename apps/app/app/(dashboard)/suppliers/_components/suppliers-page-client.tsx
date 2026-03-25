"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { Plus, Building2, LayoutGrid, List, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SupplierCard } from "./supplier-card";
import { SupplierFilters, FilterState } from "./supplier-filters";
import { SupplierFormDialog } from "./supplier-form-dialog";
import {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  getSuppliersAction,
} from "../_actions/suppliers";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/alert-dialog";

type SuppliersResponse = {
  data: Supplier[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type SuppliersPageClientProps = {
  initialData: SuppliersResponse;
  cities: string[];
};

export function SuppliersPageClient({
  initialData,
  cities,
}: SuppliersPageClientProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialData.data);
  const [meta, setMeta] = useState(initialData.meta);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "",
    city: "",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch suppliers with filters using server action
  const fetchSuppliers = useCallback(
    async (newFilters: FilterState, page: number = 1) => {
      startTransition(async () => {
        try {
          const result = await getSuppliersAction({
            search: newFilters.search || undefined,
            status: (newFilters.status as "active" | "inactive") || undefined,
            city: newFilters.city || undefined,
            page,
            limit: 24,
          });
          setSuppliers(result.data);
          setMeta(result.meta);
        } catch (error: any) {
          toast.error(error.message || "Gagal memuat pemasok");
        }
      });
    },
    []
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      fetchSuppliers(newFilters, 1);
    },
    [fetchSuppliers]
  );

  const handleCreateSupplier = async (data: CreateSupplierInput) => {
    try {
      await createSupplierAction(data);
      toast.success("Pemasok berhasil ditambahkan");
      // Refresh list
      fetchSuppliers(filters, meta.page);
      return Promise.resolve();
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pemasok");
      throw error;
    }
  };

  const handleUpdateSupplier = async (data: UpdateSupplierInput) => {
    if (!editingSupplier) return Promise.resolve();
    try {
      await updateSupplierAction(editingSupplier.id, data);
      toast.success("Pemasok berhasil diperbarui");
      // Refresh list
      fetchSuppliers(filters, meta.page);
      setEditingSupplier(null);
      return Promise.resolve();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui pemasok");
      throw error;
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplierAction(deletingSupplier.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== deletingSupplier.id));
      toast.success("Pemasok berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus pemasok");
    } finally {
      setDeletingSupplier(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    fetchSuppliers(filters, page);
  };

  // Skeleton loading component
  const LoadingSkeleton = () => (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card overflow-hidden animate-pulse"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="h-4 w-1/2 bg-muted rounded pt-2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pemasok</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola {meta.total} pemasok dalam daftar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2" disabled={isPending}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="h-9 gap-2" onClick={openCreateDialog} disabled={isPending}>
            <Plus className="h-4 w-4" />
            Tambah Pemasok
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-card rounded-xl border border-border/60">
        <SupplierFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          cities={cities}
        />
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Grid/List */}
      {isPending ? (
        <LoadingSkeleton />
      ) : suppliers.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {filters.search || filters.status || filters.city
              ? "Tidak ada pemasok yang sesuai"
              : "Belum ada pemasok"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {filters.search || filters.status || filters.city
              ? "Coba ubah filter atau pencarian Anda."
              : "Tambahkan pemasok pertama Anda untuk mulai mengelola daftar."}
          </p>
          {!filters.search && !filters.status && !filters.city && (
            <Button className="mt-6" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pemasok Pertama
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(meta.page - 1) * meta.limit + 1} -{" "}
                {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} pemasok
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page === 1 || isPending}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  {isPending && meta.page > 1 ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Halaman {meta.page} dari {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page === meta.totalPages || isPending}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  {isPending && meta.page < meta.totalPages ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <SupplierFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={async (data) => {
          if (editingSupplier) {
            await handleUpdateSupplier(data);
          } else {
            await handleCreateSupplier(data as CreateSupplierInput);
          }
        }}
        initialData={editingSupplier}
        mode={editingSupplier ? "edit" : "create"}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pemasok</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pemasok{" "}
              <strong>{deletingSupplier?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              {deletingSupplier?.productCount ? (
                <p className="mt-2 text-destructive">
                  Pemasok ini memiliki {deletingSupplier.productCount} produk. 
                  Anda harus menghapus atau memindahkan produk terlebih dahulu.
                </p>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingSupplier(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              disabled={!!deletingSupplier?.productCount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
