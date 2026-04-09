import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { EditCustomerClient } from "../../_components/edit-customer-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

interface EditCustomerPageProps {
  params: Promise<{ customerId: string }>;
}

export async function generateMetadata({ params }: EditCustomerPageProps): Promise<Metadata> {
  const { customerId } = await params;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.beres.io";
  return {
    title: `Edit Pelanggan ${customerId}`,
    alternates: {
      canonical: `${appBaseUrl}/crm/${customerId}/edit`,
    },
  };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
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

    // Fetch customer and tags in parallel
    const [customerRes, tagsRes] = await Promise.all([
      apiClient.api.dashboard.crm.customers[":id"].$get(
        { param: { id: customerId } },
        { headers: { cookie } }
      ),
      apiClient.api.dashboard.crm.tags.$get(
        undefined,
        { headers: { cookie } }
      ),
    ]);

    if (!customerRes.ok) {
      if (customerRes.status === 404) {
        notFound();
      }
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Edit Pelanggan</h1>
          </div>
          <PageErrorState
            title="Gagal memuat data pelanggan"
            description="Terjadi kesalahan saat memuat data pelanggan."
            action={<ErrorRetryAction />}
          />
        </div>
      );
    }

    const [customer, tags] = await Promise.all([
      customerRes.json(),
      tagsRes.ok ? tagsRes.json() : { data: [] },
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit informasi pelanggan {customer.name}
          </p>
        </div>
        <EditCustomerClient customer={customer} tags={tags.data || []} />
      </div>
    );
  } catch (error: any) {
    console.error("Unexpected error in EditCustomerPage:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Edit Pelanggan</h1>
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
