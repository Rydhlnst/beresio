import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { CreateCustomerClient } from "../_components/create-customer-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
  title: "Tambah Pelanggan | Beres",
  description: "Tambah pelanggan baru",
};
export const dynamic = "force-dynamic";

export default async function CreateCustomerPage() {
  try {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
      redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";

    // Fetch tags for the form
    const tagsRes = await apiClient.api.dashboard.crm.tags.$get(
      undefined,
      { headers: { cookie } }
    );

    if (!tagsRes.ok) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tambah Pelanggan</h1>
          </div>
          <PageErrorState
            title="Gagal memuat data"
            description="Terjadi kesalahan saat memuat data tags."
            action={<ErrorRetryAction />}
          />
        </div>
      );
    }

    const tags = await tagsRes.json();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tambah Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tambah pelanggan baru ke database
          </p>
        </div>
        <CreateCustomerClient tags={tags.data || []} />
      </div>
    );
  } catch (error: any) {
    console.error("Unexpected error in CreateCustomerPage:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tambah Pelanggan</h1>
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
