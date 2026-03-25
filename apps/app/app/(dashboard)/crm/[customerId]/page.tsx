import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { CustomerDetailClient } from "../_components/customer-detail-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

interface CustomerDetailPageProps {
  params: Promise<{ customerId: string }>;
}

export async function generateMetadata({ params }: CustomerDetailPageProps): Promise<Metadata> {
  const { customerId } = await params;
  return {
    title: `Detail Pelanggan | Beres`,
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  try {
    const { customerId } = await params;
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
      redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";

    // Fetch customer detail
    const customerRes = await apiClient.api.dashboard.crm.customers[":id"].$get(
      { param: { id: customerId } },
      { headers: { cookie } }
    );

    if (!customerRes.ok) {
      if (customerRes.status === 404) {
        notFound();
      }
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Detail Pelanggan</h1>
          </div>
          <PageErrorState
            title="Gagal memuat data pelanggan"
            description="Terjadi kesalahan saat memuat data pelanggan."
            action={<ErrorRetryAction />}
          />
        </div>
      );
    }

    const customer = await customerRes.json();

    return (
      <CustomerDetailClient
        customer={customer}
      />
    );
  } catch (error: any) {
    console.error("Unexpected error in CustomerDetailPage:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Detail Pelanggan</h1>
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
