import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { ProductDetailClient } from "./_components/product-detail-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Detail Produk | Beres",
    description: "Lihat dan kelola detail produk",
};

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
        redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";

    // Fetch product detail
    const [productRes, categoriesRes, suppliersRes] = await Promise.all([
        apiClient.api.dashboard.products[":id"].$get(
            { param: { id } },
            { headers: { cookie } }
        ),
        apiClient.api.dashboard.products.categories.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.products.suppliers.$get(undefined, { headers: { cookie } }),
    ]);

    if (!productRes.ok) {
        if (productRes.status === 404) {
            notFound();
        }
        
        console.error("Failed to fetch product:", await productRes.text());
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href="/products">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold text-foreground">Detail Produk</h1>
                </div>
                <PageErrorState
                    title="Gagal memuat produk"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const productBody = await productRes.json();
    const categoriesBody = await categoriesRes.json();
    const suppliersBody = await suppliersRes.json();

    return (
        <ProductDetailClient
            product={productBody.data}
            categories={categoriesBody.data || []}
            suppliers={suppliersBody.data || []}
        />
    );
}
