"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomerForm } from "./customer-form";
import { Customer, CustomerTag } from "./crm-types";

interface EditCustomerClientProps {
  customer: Customer;
  tags: CustomerTag[];
}

export function EditCustomerClient({ customer, tags }: EditCustomerClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/dashboard/crm/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengupdate pelanggan");
      }

      toast.success("Pelanggan berhasil diupdate");
      router.push(`/crm/${customer.id}`);
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
      customer={customer}
      tags={tags}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
