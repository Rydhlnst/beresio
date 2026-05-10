import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { TagsPageClient } from "../_components/tags-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
  title: "Tags Pelanggan | Beres",
  description: "Kelola tags pelanggan",
};
export const dynamic = "force-dynamic";

export default async function TagsPage() {
  try {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
      redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";

    // Fetch tags
    const tagsRes = await apiClient.api.dashboard.crm.tags.$get(
      undefined,
      { headers: { cookie } }
    );

    if (!tagsRes.ok) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tags Pelanggan</h1>
          </div>
          <PageErrorState
            title="Gagal memuat data tags"
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
          <h1 className="text-2xl font-semibold text-foreground">Tags Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola tags untuk mengelompokkan pelanggan
          </p>
        </div>
        <TagsPageClient tags={tags.data || []} />
      </div>
    );
  } catch (error: any) {
    console.error("Unexpected error in TagsPage:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tags Pelanggan</h1>
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
