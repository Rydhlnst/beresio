import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SuppliersPageClient } from "./_components/suppliers-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { getSuppliersAction, getCitiesAction } from "./_actions/suppliers";

export const metadata: Metadata = {
  title: "Pemasok | Beres",
  description: "Kelola daftar pemasok dan riwayat pembelian",
};

export default async function SuppliersPage() {
  try {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
      redirect("/login");
    }

    // Fetch initial data using server actions
    let suppliersData;
    let citiesData;

    try {
      suppliersData = await getSuppliersAction({ page: 1, limit: 24 });
    } catch (e: any) {
      console.error("Suppliers fetch error:", e);
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pemasok</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Kelola daftar pemasok dan riwayat pembelian.
            </p>
          </div>
          <PageErrorState
            title="Gagal memuat pemasok"
            description={e.message || "Backend API tidak dapat diakses. Pastikan backend server berjalan."}
            action={<ErrorRetryAction />}
          />
        </div>
      );
    }

    try {
      citiesData = await getCitiesAction();
    } catch (e) {
      console.error("Cities fetch error:", e);
      citiesData = { data: [] };
    }

    return (
      <SuppliersPageClient
        initialData={suppliersData}
        cities={citiesData.data || []}
      />
    );
  } catch (error: any) {
    console.error("Unexpected error in SuppliersPage:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pemasok</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola daftar pemasok dan riwayat pembelian.
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
