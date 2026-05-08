"use client";

import { useState, useCallback, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Plus, Package, LayoutGrid, List, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { ProductCardV2, ProductV2 } from "./product-card-v2";
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
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

type ProductsResponse = {
  data: ProductV2[];
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
  const [products, setProducts] = useState<ProductV2[]>(initialData.data);
  const [meta, setMeta] = useState(initialData.meta);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    categoryId: "",
    supplierId: "",
    status: "",
    stockStatus: "",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductV2 | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductV2 | null>(null);
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
            limit: "24",
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
    fetchProducts(filters, meta.page);
  };

  const handleUpdateProduct = async (data: UpdateProductInput) => {
    if (!editingProduct) return;
    await updateProductAction(editingProduct.id, data);
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

  const openEditDialog = (product: ProductV2) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (product: ProductV2) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(filters, page);
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Katalog Produk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola {meta.total} produk dalam katalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="h-9 gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-card rounded-xl border border-border/60">
        <ProductFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
          suppliers={suppliers}
        />
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedProducts.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedProducts.size} produk dipilih
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Batal
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Aksi Massal
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Hapus Terpilih</DropdownMenuItem>
                <DropdownMenuItem>Ubah Status</DropdownMenuItem>
                <DropdownMenuItem>Ubah Kategori</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-5 w-full bg-muted rounded" />
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            {filters.search || filters.categoryId || filters.stockStatus
              ? "Tidak ada produk yang sesuai"
              : "Belum ada produk"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {filters.search || filters.categoryId || filters.stockStatus
              ? "Coba ubah filter atau pencarian Anda."
              : "Tambahkan produk pertama Anda untuk mulai mengelola katalog."}
          </p>
          {!filters.search && !filters.categoryId && !filters.stockStatus && (
            <Button className="mt-6" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Produk Pertama
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCardV2
                key={product.id}
                product={product}
                isSelected={selectedProducts.has(product.id)}
                onSelect={() => toggleProductSelection(product.id)}
                showCheckbox={selectedProducts.size > 0}
                onQuickView={openEditDialog}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
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
        onSubmit={async (data) => {
          if (editingProduct) {
            await handleUpdateProduct(data as UpdateProductInput);
            return;
          }
          await handleCreateProduct(data as CreateProductInput);
        }}
        initialData={
          editingProduct
            ? {
                id: editingProduct.id,
                name: editingProduct.name,
                sku: editingProduct.sku ?? undefined,
                barcode: editingProduct.barcode ?? undefined,
                categoryId: editingProduct.category?.id ?? undefined,
                supplierId: editingProduct.supplier?.id ?? undefined,
                basePrice: editingProduct.pricing.basePrice,
                salePrice: editingProduct.pricing.salePrice ?? undefined,
                costPrice: editingProduct.pricing.costPrice ?? undefined,
                imageUrl: editingProduct.imageUrl ?? undefined,
                isActive: editingProduct.isActive,
                isFeatured: editingProduct.isFeatured,
              }
            : undefined
        }
        categories={categories}
        suppliers={suppliers}
        mode={editingProduct ? "edit" : "create"}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
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
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
