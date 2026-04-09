import Image from "next/image";
import Link from "next/link";

import { OnboardingProgress } from "./_components/onboarding-progress";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const marketingBaseUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[#EEF2F7] p-3 sm:p-5 md:p-6">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-[1280px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_-50px_rgba(15,23,42,0.55)] md:min-h-[calc(100svh-3rem)]">
        <aside className="relative hidden w-[360px] overflow-hidden border-r border-slate-200 bg-gradient-to-b from-[#345BFF] via-[#2C51ED] to-[#1F43D0] px-8 py-10 text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-16 bottom-24 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
          </div>

          <Link href={marketingBaseUrl} className="relative inline-flex items-center gap-2 text-white/90">
            <Image src="/logo.svg" alt="Beres logo" width={106} height={28} className="h-7 w-auto brightness-0 invert" />
          </Link>

          <div className="relative mt-14 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Business Onboarding</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Setup usaha lebih rapi, siap dipakai dari hari pertama.
            </h1>
            <p className="text-sm leading-relaxed text-white/80">
              Ikuti dua langkah inti untuk menyiapkan organisasi dan cabang operasional pertamamu.
            </p>
          </div>

          <div className="relative mt-10 space-y-3 text-sm">
            <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="font-semibold">1. Profil organisasi</p>
              <p className="mt-1 text-white/80">Nama usaha, tipe bisnis, dan fondasi akses tim.</p>
            </div>
            <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="font-semibold">2. Cabang pertama</p>
              <p className="mt-1 text-white/80">Alamat lengkap, wilayah operasional, dan kontak utama.</p>
            </div>
          </div>

          <p className="relative mt-auto text-xs text-white/70">
            Data onboarding langsung dipakai untuk transaksi, role, dan laporan operasional.
          </p>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200/90 px-6 py-4 md:px-10">
            <p className="text-sm font-medium text-slate-600">Welcome to Beres App</p>
            <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
              <Link href={`${marketingBaseUrl}/privacy`} className="transition-colors hover:text-slate-900">
                Privacy
              </Link>
              <Link href={`${marketingBaseUrl}/terms`} className="transition-colors hover:text-slate-900">
                Terms
              </Link>
            </div>
          </div>

          <OnboardingProgress />

          <div className="flex-1 overflow-y-auto px-6 py-7 md:px-10 md:py-9">{children}</div>
        </section>
      </div>
    </div>
  );
}
