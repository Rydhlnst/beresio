"use client";

import { useState } from "react";
import { Supplier, UpdateSupplierInput, updateSupplierAction, deleteSupplierAction } from "../../_actions/suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Package,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { SupplierFormDialog } from "../../_components/supplier-form-dialog";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SupplierDetailClientProps {
  supplier: Supplier;
}

export function SupplierDetailClient({ supplier: initialSupplier }: SupplierDetailClientProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier>(initialSupplier);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (data: UpdateSupplierInput) => {
    setIsLoading(true);
    try {
      await updateSupplierAction(supplier.id, data);
      // Update local state
      setSupplier((prev) => ({ ...prev, ...data }));
      toast.success("Pemasok berhasil diperbarui");
      setIsEditOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui pemasok");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteSupplierAction(supplier.id);
      toast.success("Pemasok berhasil dihapus");
      router.push("/suppliers");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus pemasok");
      setIsLoading(false);
      setIsDeleteOpen(false);
    }
  };

  const hasProducts = !!supplier.productCount && supplier.productCount > 0;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setIsEditOpen(true)}
          disabled={isLoading}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => setIsDeleteOpen(true)}
          disabled={hasProducts || isLoading}
          title={hasProducts ? "Tidak dapat menghapus pemasok dengan produk" : "Hapus pemasok"}
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant={supplier.isActive ? "default" : "secondary"}
          className={cn(
            supplier.isActive
              ? "bg-green-100 text-green-700 hover:bg-green-100"
              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
          )}
        >
          {supplier.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
        {hasProducts && (
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {supplier.productCount} Produk
          </Badge>
        )}
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="info">Informasi</TabsTrigger>
          <TabsTrigger value="products">Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Kontak
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.contactName ? (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Nama Kontak</p>
                      <p className="text-sm text-muted-foreground">{supplier.contactName}</p>
                    </div>
                  </div>
                ) : null}
                {supplier.phone ? (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Telepon</p>
                      <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                    </div>
                  </div>
                ) : null}
                {supplier.email ? (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{supplier.email}</p>
                    </div>
                  </div>
                ) : null}
                {!supplier.contactName && !supplier.phone && !supplier.email && (
                  <p className="text-sm text-muted-foreground italic">
                    Belum ada informasi kontak
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.address ? (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {supplier.address}
                      </p>
                    </div>
                  </div>
                ) : null}
                {(supplier.city || supplier.province) && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Kota / Provinsi</p>
                      <p className="text-sm text-muted-foreground">
                        {[supplier.city, supplier.province].filter(Boolean).join(", ")}
                        {supplier.postalCode && ` (${supplier.postalCode})`}
                      </p>
                    </div>
                  </div>
                )}
                {!supplier.address && !supplier.city && !supplier.province && (
                  <p className="text-sm text-muted-foreground italic">
                    Belum ada alamat
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informasi Bank
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.bankName ? (
                  <>
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Bank</p>
                        <p className="text-sm text-muted-foreground">{supplier.bankName}</p>
                      </div>
                    </div>
                    {supplier.bankAccountNumber && (
                      <div className="flex items-start gap-3">
                        <div className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">Nomor Rekening</p>
                          <p className="text-sm text-muted-foreground">{supplier.bankAccountNumber}</p>
                        </div>
                      </div>
                    )}
                    {supplier.bankAccountName && (
                      <div className="flex items-start gap-3">
                        <div className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">Atas Nama</p>
                          <p className="text-sm text-muted-foreground">{supplier.bankAccountName}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Belum ada informasi bank
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Catatan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supplier.notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {supplier.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Belum ada catatan
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produk dari {supplier.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasProducts ? (
                <p className="text-sm text-muted-foreground">
                  Menampilkan {supplier.productCount} produk dari pemasok ini.
                  {/* TODO: Add product list component */}
                </p>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada produk dari pemasok ini
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <SupplierFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
        initialData={supplier}
        mode="edit"
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pemasok</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pemasok{" "}
              <strong>{supplier.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
