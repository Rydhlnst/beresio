"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Checkbox } from "@repo/ui/checkbox";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Package, ImageIcon } from "lucide-react";
import { ProductCategory, Supplier, CreateProductInput, UpdateProductInput } from "../_actions/products";
import { ImageUpload } from "@/components/shared/image-upload";

const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(150),
  sku: z.string().max(60).optional(),
  barcode: z.string().max(50).optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  basePrice: z.number().min(0, "Harga tidak boleh negatif"),
  salePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(255).optional(),
  weight: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

type ProductFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  initialData?: Partial<ProductFormData> & { id?: string };
  categories: ProductCategory[];
  suppliers: Supplier[];
  mode: "create" | "edit";
};

export function ProductFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  suppliers,
  mode,
}: ProductFormDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const defaultValues = {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      barcode: initialData?.barcode || "",
      categoryId: initialData?.categoryId || "",
      supplierId: initialData?.supplierId || "",
      basePrice: initialData?.basePrice || 0,
      salePrice: initialData?.salePrice || undefined,
      costPrice: initialData?.costPrice || undefined,
      description: initialData?.description || "",
      shortDescription: initialData?.shortDescription || "",
      weight: initialData?.weight || undefined,
      imageUrl: initialData?.imageUrl || "",
      isActive: initialData?.isActive !== false,
      isFeatured: initialData?.isFeatured === true,
  } satisfies ProductFormData;

  const form = useForm({
    defaultValues,
    validators: {
      onChange: productSchema as any,
    },
    onSubmit: async ({ value }) => {
      try {
        await onSubmit({
          ...value,
          categoryId: value.categoryId || undefined,
          supplierId: value.supplierId || undefined,
          sku: value.sku || undefined,
          barcode: value.barcode || undefined,
        });
        toast.success(mode === "create" ? "Produk berhasil dibuat" : "Produk berhasil diupdate");
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Gagal menyimpan produk");
      }
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen]);

  const formatPrice = (value: number) => {
    if (!value) return "";
    return value.toString();
  };

  const parsePrice = (value: string) => {
    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
    return isNaN(num) ? 0 : num;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Tambah Produk" : "Edit Produk"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tambahkan produk baru ke katalog."
              : "Update informasi produk."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Dasar</TabsTrigger>
              <TabsTrigger value="pricing">Harga</TabsTrigger>
              <TabsTrigger value="advanced">Lanjutan</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nama Produk <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Masukkan nama produk"
                      className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                    )}
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="sku"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="IND-001"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="barcode"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="8998866200313"
                      />
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="categoryId"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select
                      value={field.state.value || "none"}
                      onValueChange={(value) =>
                        field.handleChange(value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanpa Kategori</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <form.Field
                name="imageUrl"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Gambar Produk</Label>
                    <ImageUpload
                      value={field.state.value}
                      onChange={(url) => field.handleChange(url)}
                      onClear={() => field.handleChange("")}
                    />
                  </div>
                )}
              />
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="basePrice"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">
                        Harga Dasar <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          id="basePrice"
                          type="number"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(parseInt(e.target.value) || 0)}
                          onBlur={field.handleBlur}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  )}
                />

                <form.Field
                  name="salePrice"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Harga Jual</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          Rp
                        </span>
                        <Input
                          id="salePrice"
                          type="number"
                          value={field.state.value || ""}
                          onChange={(e) =>
                            field.handleChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          onBlur={field.handleBlur}
                          className="pl-9"
                          placeholder="Opsional"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>

              <form.Field
                name="costPrice"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Harga Modal (COGS)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        id="costPrice"
                        type="number"
                        value={field.state.value || ""}
                        onChange={(e) =>
                          field.handleChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        onBlur={field.handleBlur}
                        className="pl-9"
                        placeholder="Untuk hitung margin"
                      />
                    </div>
                  </div>
                )}
              />

              <form.Field
                name="supplierId"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Pemasok</Label>
                    <Select
                      value={field.state.value || "none"}
                      onValueChange={(value) =>
                        field.handleChange(value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pemasok" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanpa Pemasok</SelectItem>
                        {suppliers.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <form.Field
                name="description"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <textarea
                      id="description"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Deskripsi lengkap produk..."
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="weight"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="weight">Berat (gram)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={field.state.value || ""}
                        onChange={(e) =>
                          field.handleChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        onBlur={field.handleBlur}
                        placeholder="1000"
                      />
                    </div>
                  )}
                />

                <form.Field
                  name="shortDescription"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">Deskripsi Singkat</Label>
                      <Input
                        id="shortDescription"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Maksimal 255 karakter"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <form.Field
                  name="isActive"
                  children={(field) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                      />
                      <Label htmlFor="isActive" className="font-normal">
                        Produk Aktif
                      </Label>
                    </div>
                  )}
                />

                <form.Field
                  name="isFeatured"
                  children={(field) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked === true)}
                      />
                      <Label htmlFor="isFeatured" className="font-normal">
                        Produk Unggulan
                      </Label>
                    </div>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "create" ? "Simpan Produk" : "Update Produk"}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
