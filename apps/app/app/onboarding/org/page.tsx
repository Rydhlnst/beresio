import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Building2, ShieldCheck, Sparkles } from "lucide-react";

import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";

import { OrgOnboardingForm } from "./_components/org-onboarding-form";

export const metadata = {
  title: "Daftarkan Usaha",
  description: "Lengkapi data usaha utama kamu untuk mulai menggunakan Beres",
};

/**
 * Onboarding Organization Page
 *
 * STRICT RULE: This page is ONLY for users who have NO organizations.
 * If user has any organization, they are redirected to dashboard.
 * For creating additional organizations after the first one, use /dashboard/organizations/new
 */
export default async function OnboardingOrgPage() {
  const db = createDbNextjs(process.env.DATABASE_URL!);
  const authInstance = auth(db);

  const session = await authInstance.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const orgData = await authInstance.api.listOrganizations({
    headers: await headers(),
  });

  const hasOrg = orgData && orgData.length > 0;

  if (hasOrg) {
    redirect("/");
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <section className="w-full max-w-[760px] max-h-full overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Step 1</p>
          <h2 className="text-2xl font-semibold leading-tight text-foreground">Daftarkan organisasi bisnismu</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Kita simpan identitas usaha utama dulu, lalu lanjut setup cabang pertama sebagai titik operasional.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
            <Building2 className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">Entitas usaha tunggal</p>
            <p className="text-xs text-muted-foreground">Menjadi parent untuk seluruh cabang dan tim.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">Akses role otomatis</p>
            <p className="text-xs text-muted-foreground">Role owner dan permission dasar di-bootstrap setelah submit.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">Lanjut tanpa setup ulang</p>
            <p className="text-xs text-muted-foreground">Data ini dipakai langsung di langkah cabang berikutnya.</p>
          </div>
        </div>

        <div className="mt-6">
          <OrgOnboardingForm />
        </div>
      </section>
    </div>
  );
}
