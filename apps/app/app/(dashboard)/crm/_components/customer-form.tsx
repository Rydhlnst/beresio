"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { X } from "lucide-react";
import { Customer, CustomerTag } from "./crm-types";

const customerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(150),
  phone: z.string().min(1, "Nomor telepon wajib diisi").max(20),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  address: z.string().max(300).optional(),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  source: z.string().max(50).optional(),
  status: z.enum(["active", "inactive", "vip"]).default("active"),
  tagIds: z.array(z.string()).default([]),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  tags: CustomerTag[];
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const statusOptions = [
  { value: "active", label: "Aktif" },
  { value: "vip", label: "VIP" },
  { value: "inactive", label: "Nonaktif" },
];

const genderOptions = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
  { value: "other", label: "Lainnya" },
];

const sourceOptions = [
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "online", label: "Online" },
  { value: "social_media", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "other", label: "Lainnya" },
];

export function CustomerForm({ customer, tags, onSubmit, isSubmitting }: CustomerFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    customer?.tags?.map((t) => t.id) || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      birthDate: customer?.birthDate
        ? new Date(customer.birthDate).toISOString().split("T")[0]
        : "",
      gender: customer?.gender || undefined,
      source: customer?.source || "",
      status: customer?.status || "active",
      tagIds: customer?.tags?.map((t) => t.id) || [],
    },
  });

  const watchedStatus = watch("status");
  const watchedGender = watch("gender");

  const handleTagSelect = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      const newTags = [...selectedTags, tagId];
      setSelectedTags(newTags);
      setValue("tagIds", newTags);
    }
  };

  const handleTagRemove = (tagId: string) => {
    const newTags = selectedTags.filter((id) => id !== tagId);
    setSelectedTags(newTags);
    setValue("tagIds", newTags);
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nama pelanggan"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Nomor Telepon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="08xxxxxxxxxx"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Tanggal Lahir</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={watchedGender || ""}
                onValueChange={(value) =>
                  setValue("gender", value as "male" | "female" | "other")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Sumber</Label>
              <Select
                value={watch("source") || ""}
                onValueChange={(value) => setValue("source", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sumber" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              placeholder="Alamat lengkap"
              {...register("address")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(value) =>
                setValue("status", value as "active" | "inactive" | "vip")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada tags dipilih</p>
              )}
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="gap-1 pr-1"
                    style={{
                      borderColor: tag.color || undefined,
                      color: tag.color || undefined,
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag.id)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
            <Select onValueChange={handleTagSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Tambah tag..." />
              </SelectTrigger>
              <SelectContent>
                {tags
                  .filter((t) => !selectedTags.includes(t.id))
                  .map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color || "#ccc" }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : customer ? "Simpan Perubahan" : "Tambah Pelanggan"}
        </Button>
      </div>
    </form>
  );
}
