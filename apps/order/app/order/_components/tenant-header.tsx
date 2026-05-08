import type { PublicTenantInfo } from "@/lib/public-order-api";

type TenantHeaderProps = {
    tenant: PublicTenantInfo;
};

export function TenantHeader({ tenant }: TenantHeaderProps) {
    return (
        <header className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
                {tenant.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={tenant.logoUrl}
                        alt={`${tenant.name} logo`}
                        className="h-12 w-12 rounded-xl border border-border object-cover"
                    />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {tenant.name.slice(0, 2).toUpperCase()}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Order Laundry</p>
                    <h1 className="truncate text-lg font-semibold text-foreground">{tenant.name}</h1>
                </div>
            </div>
            {tenant.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tenant.description}</p>
            ) : null}
        </header>
    );
}
