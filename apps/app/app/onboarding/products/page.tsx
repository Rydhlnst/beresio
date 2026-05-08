import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { FileSpreadsheet, PackagePlus, SkipForward } from "lucide-react";

import { auth } from "@/lib/auth";
import { branches, createDbNextjs, products } from "@beresio/db";
import { ProductOnboardingForm } from "./_components/product-onboarding-form";

export const metadata = {
    title: "Tambah Produk Awal",
    description: "Tambahkan produk pertama atau lewati untuk dilanjutkan dari dashboard.",
};

export default async function OnboardingProductsPage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();
    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
        redirect("/login");
    }

    const orgData = await authInstance.api.listOrganizations({ headers: reqHeaders });
    if (!orgData || orgData.length === 0) {
        redirect("/onboarding/org");
    }

    const orgId = (session as any)?.activeOrganizationId ?? orgData[0]?.id;
    if (!orgId) {
        redirect("/onboarding/org");
    }

    const [branchCountRow, productCountRow] = await Promise.all([
        db
            .select({ count: sql<number>`count(*)` })
            .from(branches)
            .where(eq(branches.organizationId, orgId)),
        db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.organizationId, orgId)),
    ]);

    if (Number(branchCountRow[0]?.count ?? 0) === 0) {
        redirect("/onboarding/branch");
    }

    if (Number(productCountRow[0]?.count ?? 0) > 0) {
        redirect("/onboarding/team");
    }

    return (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <section className="w-full max-w-[860px] max-h-full overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Step 3</p>
                    <h2 className="text-2xl font-semibold leading-tight text-foreground">Tambah produk awal</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Tambahkan minimal satu produk agar POS bisa langsung dicoba. Langkah ini bisa dilewati dan akan masuk checklist dashboard.
                    </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <FileSpreadsheet className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Import CSV</p>
                        <p className="text-xs text-muted-foreground">Template tersedia dari halaman Products setelah setup.</p>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-3">
                        <PackagePlus className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Tambah manual</p>
                        <p className="text-xs text-muted-foreground">Recommended untuk mulai cepat dengan beberapa produk.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <SkipForward className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Bisa dilewati</p>
                        <p className="text-xs text-muted-foreground">Checklist akan mengingatkan setelah masuk dashboard.</p>
                    </div>
                </div>

                <div className="mt-6">
                    <ProductOnboardingForm />
                </div>
            </section>
        </div>
    );
}
