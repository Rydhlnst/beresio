"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
  ArrowLeft,
  Building2,
  User,
  CreditCard,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { createSupplierAction, CreateSupplierInput } from "../_actions/suppliers";
import { Card, CardContent } from "@repo/ui/card";

const INITIAL_FORM_DATA: CreateSupplierInput = {
  name: "",
  code: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  notes: "",
  isActive: true,
};

export default function NewSupplierPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<CreateSupplierInput>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateSupplierInput, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nama pemasok wajib diisi";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Mohon periksa form Anda");
      return;
    }

    setIsLoading(true);
    try {
      await createSupplierAction(formData);
      toast.success("Pemasok berhasil ditambahkan");
      router.push("/suppliers");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pemasok");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild disabled={isLoading}>
          <Link href="/suppliers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tambah Pemasok</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tambahkan pemasok baru ke daftar.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="basic" className="text-xs">
              <Building2 className="mr-2 h-3.5 w-3.5" />
              Dasar
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs">
              <User className="mr-2 h-3.5 w-3.5" />
              Kontak
            </TabsTrigger>
            <TabsTrigger value="bank" className="text-xs">
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Bank
            </TabsTrigger>
          </TabsList>

          <Card className="mt-6">
            <CardContent className="pt-6">
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nama Pemasok <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Masukkan nama pemasok"
                      disabled={isLoading}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Kode Pemasok</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleChange("code", e.target.value)}
                      placeholder="Contoh: SUP001"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.isActive ? "active" : "inactive"}
                    onValueChange={(value) => handleChange("isActive", value === "active")}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="Kota"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => handleChange("province", e.target.value)}
                      placeholder="Provinsi"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Kode Pos</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleChange("postalCode", e.target.value)}
                      placeholder="Kode Pos"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nama Kontak</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleChange("contactName", e.target.value)}
                    placeholder="Nama orang yang dapat dihubungi"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="Contoh: 08123456789"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="email@contoh.com"
                      disabled={isLoading}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Bank Tab */}
              <TabsContent value="bank" className="space-y-4 m-0">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Nama Bank</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleChange("bankName", e.target.value)}
                    placeholder="Contoh: BCA, Mandiri, BNI"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Nomor Rekening</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                      placeholder="Nomor rekening bank"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountName">Atas Nama</Label>
                    <Input
                      id="bankAccountName"
                      value={formData.bankAccountName}
                      onChange={(e) => handleChange("bankAccountName", e.target.value)}
                      placeholder="Nama pemilik rekening"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Catatan tambahan tentang pemasok"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild disabled={isLoading}>
            <Link href="/suppliers">Batal</Link>
          </Button>
          <Button type="submit" disabled={isLoading || !formData.name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && <Check className="mr-2 h-4 w-4" />}
            Simpan Pemasok
          </Button>
        </div>
      </form>
    </div>
  );
}
