import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ProductsPageClient } from "./_components/products-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
    title: "Katalog Produk | Beres",
    description: "Kelola katalog produk, harga, dan stok",
};

export default async function ProductsPage() {
    try {
        const db = createDbNextjs(process.env.DATABASE_URL!);
        const authInstance = auth(db);
        const reqHeaders = await headers();

        const session = await authInstance.api.getSession({ headers: reqHeaders });

        if (!session) {
            redirect("/login");
        }

        const cookie = reqHeaders.get("cookie") || "";

        // Fetch initial data with error handling for each request
        let productsRes, categoriesRes, suppliersRes;
        let productsError, categoriesError, suppliersError;

        try {
            productsRes = await apiClient.api.dashboard.products.$get(
                { query: { page: "1", limit: "24" } },
                { headers: { cookie } }
            );
        } catch (e: any) {
            productsError = e.message;
            console.error("Products fetch error:", e);
        }

        try {
            categoriesRes = await apiClient.api.dashboard.products.categories.$get(
                undefined, 
                { headers: { cookie } }
            );
        } catch (e: any) {
            categoriesError = e.message;
            console.error("Categories fetch error:", e);
        }

        try {
            suppliersRes = await apiClient.api.dashboard.products.suppliers.$get(
                undefined, 
                { headers: { cookie } }
            );
        } catch (e: any) {
            suppliersError = e.message;
            console.error("Suppliers fetch error:", e);
        }

        // Check if any request failed
        if (!productsRes?.ok || !categoriesRes?.ok || !suppliersRes?.ok) {
            console.error("Failed to fetch products data:", {
                products: !productsRes?.ok 
                    ? (productsError || await productsRes?.text().catch(() => "Unknown error")) 
                    : "ok",
                categories: !categoriesRes?.ok 
                    ? (categoriesError || await categoriesRes?.text().catch(() => "Unknown error")) 
                    : "ok",
                suppliers: !suppliersRes?.ok 
                    ? (suppliersError || await suppliersRes?.text().catch(() => "Unknown error")) 
                    : "ok",
            });

            return (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Katalog Produk</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Kelola katalog produk, harga, dan stok.
                        </p>
                    </div>
                    <PageErrorState
                        title="Gagal memuat produk"
                        description="Backend API tidak dapat diakses. Pastikan backend server berjalan."
                        action={<ErrorRetryAction />}
                    />
                </div>
            );
        }

        // Parse responses with error handling
        let productsBody, categoriesBody, suppliersBody;
        
        try {
            productsBody = await productsRes.json();
        } catch (e) {
            console.error("Failed to parse products response:", e);
            productsBody = { data: [], meta: { total: 0, page: 1, limit: 24, totalPages: 0 } };
        }

        try {
            categoriesBody = await categoriesRes.json();
        } catch (e) {
            console.error("Failed to parse categories response:", e);
            categoriesBody = { data: [] };
        }

        try {
            suppliersBody = await suppliersRes.json();
        } catch (e) {
            console.error("Failed to parse suppliers response:", e);
            suppliersBody = { data: [] };
        }

        return (
            <ProductsPageClient
                initialData={productsBody}
                categories={categoriesBody.data || []}
                suppliers={suppliersBody.data || []}
            />
        );
    } catch (error: any) {
        console.error("Unexpected error in ProductsPage:", error);
        
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Katalog Produk</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola katalog produk, harga, dan stok.
                    </p>
                </div>
                <PageErrorState
                    title="Terjadi kesalahan"
                    description={error.message || "Silakan coba lagi nanti."}
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }
}
