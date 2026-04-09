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
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] xl:items-start">
      <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 md:p-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Step 1</p>
          <h2 className="text-2xl font-semibold leading-tight text-slate-900">Daftarkan organisasi bisnismu</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Kita simpan identitas usaha utama dulu, lalu lanjut setup cabang pertama sebagai titik operasional.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <Building2 className="mt-0.5 h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Entitas usaha tunggal</p>
              <p className="text-xs text-slate-600">Menjadi parent untuk seluruh cabang dan tim.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Akses role otomatis</p>
              <p className="text-xs text-slate-600">Role owner dan permission dasar di-bootstrap setelah submit.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Lanjut tanpa setup ulang</p>
              <p className="text-xs text-slate-600">Data ini dipakai langsung di langkah cabang berikutnya.</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <OrgOnboardingForm />
      </section>
    </div>
  );
}
