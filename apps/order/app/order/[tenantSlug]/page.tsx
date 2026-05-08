import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchPublicBranches, fetchPublicTenant } from "@/lib/public-order-api";
import { TenantHeader } from "../_components/tenant-header";
import { TenantUnavailableState } from "../_components/tenant-unavailable-state";

type TenantOrderLandingPageProps = {
    params: Promise<{ tenantSlug: string }>;
};

export default async function TenantOrderLandingPage({ params }: TenantOrderLandingPageProps) {
    const { tenantSlug } = await params;

    try {
        const tenantPayload = await fetchPublicTenant(tenantSlug);

        if (tenantPayload.defaultBranch?.branchSlug) {
            redirect(`/order/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(tenantPayload.defaultBranch.branchSlug)}`);
        }

        const branchesPayload = await fetchPublicBranches(tenantSlug);
        if (!branchesPayload.branches || branchesPayload.branches.length === 0) {
            return (
                <TenantUnavailableState
                    title="Cabang belum tersedia"
                    message="Tenant ini belum memiliki cabang aktif untuk menerima order."
                />
            );
        }

        return (
            <main className="mx-auto min-h-screen w-full max-w-xl space-y-4 px-4 py-5">
                <TenantHeader tenant={branchesPayload.tenant} />
                <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-foreground">Pilih cabang tujuan</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Pilih cabang yang paling dekat agar pickup dan verifikasi lebih cepat.
                    </p>
                    <ul className="mt-4 space-y-2">
                        {branchesPayload.branches.map((branch) => (
                            <li key={branch.id}>
                                <Link
                                    href={`/order/${encodeURIComponent(tenantSlug)}/${encodeURIComponent(branch.branchSlug)}`}
                                    className="block rounded-xl border border-border p-3 transition hover:border-primary/40"
                                >
                                    <p className="text-sm font-semibold text-foreground">{branch.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{branch.address || "Alamat belum diisi"}</p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>
        );
    } catch {
        return <TenantUnavailableState />;
    }
}
