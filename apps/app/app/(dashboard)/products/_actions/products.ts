"use server";

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  status?: "active" | "inactive";
  stockStatus?: "ok" | "low" | "out";
  sortBy?: "name" | "price" | "stock" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type CreateProductInput = {
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  supplierId?: string;
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  description?: string;
  shortDescription?: string;
  weight?: number;
  imageUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput>;

export type ProductCategory = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  code: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
};

async function getAuthHeaders() {
  return { cookie: (await cookies()).toString() };
}

export async function getProductsAction(filters: ProductFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.search) params.set("search", filters.search);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.supplierId) params.set("supplierId", filters.supplierId);
  if (filters.status) params.set("status", filters.status);
  if (filters.stockStatus) params.set("stockStatus", filters.stockStatus);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const queryString = params.toString();

  const res = await apiClient.api.dashboard.products.$get(
    queryString ? { query: Object.fromEntries(params) } : undefined,
    { headers: await getAuthHeaders() }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch products");
  }

  return res.json();
}

export async function getProductAction(id: string) {
  const res = await apiClient.api.dashboard.products[":id"].$get({
    param: { id },
  }, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch product");
  }

  return res.json();
}

export async function createProductAction(data: CreateProductInput) {
  const res = await apiClient.api.dashboard.products.$post({
    json: data,
  }, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create product");
  }

  revalidatePath("/products");
  return res.json();
}

export async function updateProductAction(id: string, data: UpdateProductInput) {
  const res = await apiClient.api.dashboard.products[":id"].$patch({
    param: { id },
    json: data,
  }, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update product");
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return res.json();
}

export async function deleteProductAction(id: string) {
  const res = await apiClient.api.dashboard.products[":id"].$delete({
    param: { id },
  }, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to delete product");
  }

  revalidatePath("/products");
  return res.json();
}

export async function getCategoriesAction() {
  const res = await apiClient.api.dashboard.products.categories.$get(
    undefined,
    { headers: await getAuthHeaders() }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch categories");
  }

  const body = await res.json();
  return body.data as ProductCategory[];
}

export async function createCategoryAction(data: {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  sortOrder?: number;
}) {
  const res = await apiClient.api.dashboard.products.categories.$post({
    json: data,
  }, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create category");
  }

  revalidatePath("/products");
  return res.json();
}

export async function getSuppliersAction() {
  const res = await apiClient.api.dashboard.products.suppliers.$get(
    undefined,
    { headers: await getAuthHeaders() }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to fetch suppliers");
  }

  const body = await res.json();
  return body.data as Supplier[];
}

export async function createSupplierAction(data: {
  name: string;
  code?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}) {
  const res = await apiClient.api.dashboard.products.suppliers.$post({
    json: data,
  }, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to create supplier");
  }

  revalidatePath("/products");
  revalidatePath("/suppliers");
  return res.json();
}
