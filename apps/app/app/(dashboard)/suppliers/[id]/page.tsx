import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { SupplierDetailClient } from "./_components/supplier-detail-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { getSupplierAction } from "../_actions/suppliers";

interface SupplierDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: SupplierDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.beres.io";
  return {
    title: `Detail Pemasok ${id}`,
    description: "Detail informasi pemasok",
    alternates: {
      canonical: `${appBaseUrl}/suppliers/${id}`,
    },
  };
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  try {
    const { id } = await params;
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
      redirect("/login");
    }

    // Fetch supplier detail using server action
    let supplier;
    try {
      supplier = await getSupplierAction(id);
    } catch (e: any) {
      console.error("Supplier detail fetch error:", e);
      
      if (e.message?.includes("not found") || e.message?.includes("404")) {
        notFound();
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/suppliers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Detail Pemasok</h1>
            </div>
          </div>
          <PageErrorState
            title="Gagal memuat data pemasok"
            description={e.message || "Backend API tidak dapat diakses. Pastikan backend server berjalan."}
            action={<ErrorRetryAction />}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{supplier.name}</h1>
              {supplier.code && (
                <p className="text-sm text-muted-foreground">{supplier.code}</p>
              )}
            </div>
          </div>
        </div>

        <SupplierDetailClient supplier={supplier} />
      </div>
    );
  } catch (error: any) {
    console.error("Unexpected error in SupplierDetailPage:", error);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Detail Pemasok</h1>
          </div>
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
