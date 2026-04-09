import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { MapPinned, PhoneCall, Route } from "lucide-react";
import { eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { branches, createDbNextjs } from "@beresio/db";

import { TeamOnboardingForm } from "./_components/team-onboarding-form";

export const metadata = {
  title: "Daftarkan Cabang Pertama",
  description: "Lengkapi data cabang pertama (nama, lokasi, alamat, dan kontak) untuk mulai operasional",
};

export default async function OnboardingTeamPage() {
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

  if (!hasOrg) {
    redirect("/onboarding/org");
  }

  const organizationId = (session as any)?.activeOrganizationId ?? orgData?.[0]?.id;

  const branchCountRows = organizationId
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(eq(branches.organizationId, organizationId))
    : [{ count: 0 }];

  const hasBranch = Number(branchCountRows[0]?.count ?? 0) > 0;

  if (hasBranch) {
    redirect("/dashboard");
  }

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)] xl:items-start">
      <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 md:p-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Step 2</p>
          <h2 className="text-2xl font-semibold leading-tight text-slate-900">Setup cabang operasional pertama</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Isi lokasi dan kontak cabang utama agar order, assignment, serta laporan langsung punya konteks area.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <MapPinned className="mt-0.5 h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Alamat lengkap & wilayah</p>
              <p className="text-xs text-slate-600">Pastikan provinsi, kota, kecamatan, dan kelurahan akurat.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <PhoneCall className="mt-0.5 h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Kontak operasional</p>
              <p className="text-xs text-slate-600">Nomor ini dipakai untuk komunikasi internal cabang.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <Route className="mt-0.5 h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Siap untuk transaksi</p>
              <p className="text-xs text-slate-600">Setelah submit, onboarding selesai dan kamu langsung masuk dashboard.</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <TeamOnboardingForm organizationId={organizationId} />
      </section>
    </div>
  );
}
