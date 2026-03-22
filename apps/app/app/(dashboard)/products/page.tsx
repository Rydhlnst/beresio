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
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
        redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";

    // Fetch initial data
    const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        apiClient.api.dashboard.products.$get(
            { query: { page: "1", limit: "20" } },
            { headers: { cookie } }
        ),
        apiClient.api.dashboard.products.categories.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.products.suppliers.$get(undefined, { headers: { cookie } }),
    ]);

    if (!productsRes.ok || !categoriesRes.ok || !suppliersRes.ok) {
        console.error("Failed to fetch products data:", {
            products: !productsRes.ok ? await productsRes.text() : "ok",
            categories: !categoriesRes.ok ? await categoriesRes.text() : "ok",
            suppliers: !suppliersRes.ok ? await suppliersRes.text() : "ok",
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
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const productsBody = await productsRes.json();
    const categoriesBody = await categoriesRes.json();
    const suppliersBody = await suppliersRes.json();

    return (
        <ProductsPageClient
            initialData={productsBody}
            categories={categoriesBody.data || []}
            suppliers={suppliersBody.data || []}
        />
    );
}
