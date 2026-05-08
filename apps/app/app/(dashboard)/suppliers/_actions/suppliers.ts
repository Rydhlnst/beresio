"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSafeApiBaseUrl } from "@/lib/safe-api-url";

export type SupplierFilters = {
  search?: string;
  status?: "active" | "inactive";
  city?: string;
  sortBy?: "name" | "code" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type CreateSupplierInput = {
  name: string;
  code?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  notes?: string;
  isActive?: boolean;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export type Supplier = {
  id: string;
  name: string;
  code: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
};

async function getApiUrl() {
  return getSafeApiBaseUrl();
}

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const cookie = cookieStore.toString();
  return {
    "Content-Type": "application/json",
    Cookie: cookie,
  };
}

export async function getSuppliersAction(filters: SupplierFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.city) params.set("city", filters.city);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const queryString = params.toString();
  const apiUrl = await getApiUrl();
  
  const res = await fetch(`${apiUrl}/api/dashboard/suppliers?${queryString}`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch suppliers");
  }

  return res.json();
}

export async function getSupplierAction(id: string) {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/api/dashboard/suppliers/${id}`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch supplier");
  }

  return res.json();
}

export async function createSupplierAction(data: CreateSupplierInput) {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/api/dashboard/suppliers`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create supplier");
  }

  revalidatePath("/suppliers");
  return res.json();
}

export async function updateSupplierAction(id: string, data: UpdateSupplierInput) {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/api/dashboard/suppliers/${id}`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update supplier");
  }

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return res.json();
}

export async function deleteSupplierAction(id: string) {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/api/dashboard/suppliers/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to delete supplier");
  }

  revalidatePath("/suppliers");
  return res.json();
}

export async function getCitiesAction() {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/api/dashboard/suppliers/cities`, {
    headers: await getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return { data: [] };
  }

  return res.json();
}
