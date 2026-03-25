import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
    title: "Role & Izin | Beres",
    description: "Kelola role dan izin akses",
};

type Role = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isSystem: boolean;
    permissionsCount: number;
};

export default async function RolesPage() {
    const cookie = (await headers()).get("cookie") || "";

    const res = await apiClient.api.dashboard.team.roles.$get(undefined, {
        headers: { cookie },
    });

    if (!res.ok) {
        console.error("Failed to fetch roles:", await res.text());
        return (
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Role & Izin</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            Kelola role dan izin sesuai kebutuhan tim.
                        </p>
                    </div>
                </div>
                <PageErrorState
                    title="Gagal memuat data role"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const body = await res.json();
    const roles = (body as { data?: Role[] }).data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Role & Izin</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola role dan izin sesuai kebutuhan tim.
                    </p>
                </div>
                <Button className="h-9 text-xs font-semibold" asChild>
                    <Link href="/tim/roles/new">Buat Role Baru</Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {roles.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                        Belum ada role. Buat role baru untuk mulai mengatur izin akses.
                    </div>
                ) : (
                    roles.map((role) => (
                        <SectionCard 
                            key={role.id} 
                            title={role.name} 
                            description={role.description || `${role.permissionsCount} izin akses`}
                        >
                            <div className="flex items-center gap-2">
                                {role.isSystem && (
                                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">
                                        System
                                    </span>
                                )}
                                <Button variant="outline" className="h-8 text-xs font-semibold" asChild>
                                    <Link href={`/tim/roles/${role.id}`}>Lihat Detail</Link>
                                </Button>
                            </div>
                        </SectionCard>
                    ))
                )}
            </div>
        </div>
    );
}
