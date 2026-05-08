import Link from "next/link";
import type { PublicTenantBranch } from "@/lib/public-order-api";

type BranchContextBarProps = {
    tenantSlug: string;
    branch: PublicTenantBranch;
};

export function BranchContextBar({ tenantSlug, branch }: BranchContextBarProps) {
    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Cabang aktif</p>
                    <h2 className="text-sm font-semibold text-foreground">{branch.name}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {branch.address || "Alamat belum diisi"}
                    </p>
                </div>
                <Link
                    href={`/order/${encodeURIComponent(tenantSlug)}`}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-foreground"
                >
                    Ganti cabang
                </Link>
            </div>
        </section>
    );
}
