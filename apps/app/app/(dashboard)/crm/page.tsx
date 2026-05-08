import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { CRMPageClient } from "./_components/crm-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
  title: "Pelanggan",
  description: "Kelola data pelanggan, tags, dan interaksi",
};

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();

    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
      redirect("/login");
    }

    const cookie = reqHeaders.get("cookie") || "";

    const resolvedSearchParams = await searchParams;

    // Parse query params
    const page = typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : '1';
    const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
    const tagId = typeof resolvedSearchParams.tagId === 'string' ? resolvedSearchParams.tagId : undefined;
    const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;

    // Fetch customers with error handling
    let customersRes, tagsRes, analyticsRes;

    try {
      customersRes = await apiClient.api.dashboard.crm.customers.$get(
        { 
          query: { 
            page,
            limit: '25',
            ...(search && { search }),
            ...(tagId && { tagId }),
            ...(status && { status }),
          } 
        },
        { headers: { cookie } }
      );
    } catch (e: any) {
      console.error("Customers fetch error:", e);
    }

    try {
      tagsRes = await apiClient.api.dashboard.crm.tags.$get(
        undefined,
        { headers: { cookie } }
      );
    } catch (e: any) {
      console.error("Tags fetch error:", e);
    }

    try {
      analyticsRes = await apiClient.api.dashboard.crm.analytics.overview.$get(
        undefined,
        { headers: { cookie } }
      );
    } catch (e: any) {
      console.error("Analytics fetch error:", e);
    }

    // Check responses
    if (!customersRes?.ok) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Pelanggan</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Kelola data pelanggan, tags, dan interaksi.
            </p>
          </div>
          <PageErrorState
            title="Gagal memuat data pelanggan"
            description="Backend API tidak dapat diakses. Pastikan backend server berjalan."
            action={<ErrorRetryAction />}
          />
        </div>
      );
    }

    // Parse responses (API wraps payload in { success, data })
    const customersPayload = await customersRes.json().catch(() => ({
      success: false,
      data: { data: [], meta: { total: 0, page: 1, limit: 25, totalPages: 0 } },
    }));
    const tagsPayload = await tagsRes?.json().catch(() => ({ success: false, data: [] }));
    const analyticsPayload = await analyticsRes?.json().catch(() => ({
      success: false,
      data: {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        activeCustomers: 0,
        vipCustomers: 0,
        inactiveCustomers: 0,
        averageLifetimeValue: 0,
        topCustomers: [],
      },
    }));

    const customersBody =
      customersPayload?.data?.data && Array.isArray(customersPayload.data.data)
        ? customersPayload.data
        : customersPayload?.data && Array.isArray(customersPayload.data)
          ? { data: customersPayload.data, meta: { total: 0, page: 1, limit: 25, totalPages: 0 } }
          : { data: [], meta: { total: 0, page: 1, limit: 25, totalPages: 0 } };

    const tagsBody = {
      data: Array.isArray(tagsPayload?.data)
        ? tagsPayload.data
        : Array.isArray(tagsPayload?.data?.data)
          ? tagsPayload.data.data
          : [],
    };

    const analyticsBody =
      analyticsPayload?.data && typeof analyticsPayload.data === "object"
        ? analyticsPayload.data
        : {
            totalCustomers: 0,
            newCustomersThisMonth: 0,
            activeCustomers: 0,
            vipCustomers: 0,
            inactiveCustomers: 0,
            averageLifetimeValue: 0,
            topCustomers: [],
          };

    return (
      <CRMPageClient
        initialData={customersBody}
        tags={tagsBody.data}
        analytics={analyticsBody}
      />
    );
  } catch (error: any) {
    console.error("Unexpected error in CRMPage:", error);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola data pelanggan, tags, dan interaksi.
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
