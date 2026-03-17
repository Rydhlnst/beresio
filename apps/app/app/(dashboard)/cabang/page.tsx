import { Metadata } from "next";
import { headers } from "next/headers";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { apiClient } from "@/lib/api-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";

export const metadata: Metadata = {
    title: "Cabang | Beres",
    description: "Kelola cabang dan performa singkat",
};

export default async function CabangPage() {
    const cookie = (await headers()).get("cookie") || "";
    const res = await apiClient.api.dashboard.branches.$get(undefined, {
        headers: { cookie },
    });

    if (!res.ok) {
        console.error("Failed to fetch branches:", await res.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Cabang</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola cabang dan lihat performa singkat.
                    </p>
                </div>
                <ErrorToast
                    id="page-branches-error"
                    title="Gagal memuat data cabang"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat data cabang"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const body = res.ok ? await res.json() : null;
    const branchRows = (body as any)?.data || [];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);

    const branches = branchRows.map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address || "-",
        status: branch.isActive ? "Aktif" : "Nonaktif",
        revenue: formatCurrency(Number(branch.revenue ?? 0)),
        orders: Number(branch.orders ?? 0),
        staff: Number(branch.staffCount ?? 0),
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Cabang</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola cabang dan lihat performa singkat.
                    </p>
                </div>
                <Button className="h-9 text-xs font-semibold">Tambah Cabang</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {branches.length === 0 ? (
                    <div className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
                        Belum ada cabang. Tambahkan cabang baru untuk mulai memantau performa.
                    </div>
                ) : (
                    branches.map((branch: any) => (
                        <div key={branch.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{branch.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{branch.address}</p>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={
                                        branch.status === "Aktif"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold"
                                            : "bg-muted/50 text-muted-foreground border-border text-[11px] font-semibold"
                                    }
                                >
                                    {branch.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Revenue</p>
                                    <p className="text-sm font-semibold text-foreground mt-1">{branch.revenue}</p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Order</p>
                                    <p className="text-sm font-semibold text-foreground mt-1">{branch.orders}</p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Staff</p>
                                    <p className="text-sm font-semibold text-foreground mt-1">{branch.staff}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="h-8 text-xs font-semibold w-full">
                                    Lihat Detail
                                </Button>
                                <Button variant="outline" className="h-8 text-xs font-semibold w-full">
                                    Pengaturan
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
