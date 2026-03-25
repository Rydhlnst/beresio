"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomerForm } from "./customer-form";
import { CustomerTag } from "./crm-types";

interface CreateCustomerClientProps {
  tags: CustomerTag[];
}

export function CreateCustomerClient({ tags }: CreateCustomerClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/dashboard/crm/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal membuat pelanggan");
      }

      toast.success("Pelanggan berhasil ditambahkan");
      router.push("/crm");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerForm
      tags={tags}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
