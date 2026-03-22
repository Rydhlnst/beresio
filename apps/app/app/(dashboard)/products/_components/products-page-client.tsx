"use client";

import { useState, useCallback, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ProductCard, Product } from "./product-card";
import { ProductFilters, FilterState } from "./product-filters";
import { ProductFormDialog } from "./product-form-dialog";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  CreateProductInput,
  UpdateProductInput,
  ProductCategory,
  Supplier,
} from "../_actions/products";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@repo/ui/alert-dialog";

type ProductsResponse = {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ProductsPageClientProps = {
  initialData: ProductsResponse;
  categories: ProductCategory[];
  suppliers: Supplier[];
};

export function ProductsPageClient({
  initialData,
  categories,
  suppliers,
}: ProductsPageClientProps) {
  const router = useTransitionRouter();
  const [products, setProducts] = useState<Product[]>(initialData.data);
  const [meta, setMeta] = useState(initialData.meta);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categoryId: "",
    supplierId: "",
    status: "",
    stockStatus: "",
  });
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch products with filters
  const fetchProducts = useCallback(
    async (newFilters: FilterState, page: number = 1) => {
      startTransition(async () => {
        try {
          const result = await fetch(`/api/dashboard/products?${new URLSearchParams({
            ...(newFilters.search && { search: newFilters.search }),
            ...(newFilters.categoryId && { categoryId: newFilters.categoryId }),
            ...(newFilters.supplierId && { supplierId: newFilters.supplierId }),
            ...(newFilters.status && { status: newFilters.status }),
            ...(newFilters.stockStatus && { stockStatus: newFilters.stockStatus }),
            page: String(page),
            limit: "20",
          })}`).then((r) => r.json());

          setProducts(result.data);
          setMeta(result.meta);
        } catch (error) {
          toast.error("Gagal memuat produk");
        }
      });
    },
    []
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      fetchProducts(newFilters, 1);
    },
    [fetchProducts]
  );

  const handleCreateProduct = async (data: CreateProductInput) => {
    await createProductAction(data);
    // Refresh data
    fetchProducts(filters, meta.page);
  };

  const handleUpdateProduct = async (data: UpdateProductInput) => {
    if (!editingProduct) return;
    await updateProductAction(editingProduct.id, data);
    // Refresh data
    fetchProducts(filters, meta.page);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProductAction(deletingProduct.id);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      toast.success("Produk berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus produk");
    } finally {
      setDeletingProduct(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(filters, page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Katalog Produk</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola katalog produk, harga, dan stok.
          </p>
        </div>
        <Button className="h-9 text-xs font-semibold" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Filters */}
      <ProductFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        suppliers={suppliers}
      />

      {/* Products Grid */}
      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card p-4 space-y-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
              <div className="h-8 w-1/3 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-border/60 bg-card p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {filters.search || filters.categoryId || filters.stockStatus || filters.status
                ? "Tidak ada produk yang sesuai"
                : "Belum ada produk"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {filters.search || filters.categoryId || filters.stockStatus || filters.status
                ? "Coba ubah filter atau pencarian Anda."
                : "Tambahkan produk pertama Anda untuk mulai mengelola katalog."}
            </p>
            {!filters.search && !filters.categoryId && !filters.stockStatus && !filters.status && (
              <Button className="mt-6" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Produk Pertama
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(meta.page - 1) * meta.limit + 1} -{" "}
                {Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} produk
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page === 1}
                  onClick={() => handlePageChange(meta.page - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Halaman {meta.page} dari {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page === meta.totalPages}
                  onClick={() => handlePageChange(meta.page + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        initialData={editingProduct || undefined}
        categories={categories}
        suppliers={suppliers}
        mode={editingProduct ? "edit" : "create"}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Hapus Produk
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk{" "}
              <strong>{deletingProduct?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProduct(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus Produk
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
