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
    <div className="h-[100svh] overflow-hidden bg-background p-2 sm:p-4 md:p-5">
      <div className="mx-auto flex h-full w-full max-w-[1280px] overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/10">
        <aside className="relative hidden w-[340px] shrink-0 overflow-y-auto border-r border-border bg-primary px-7 py-8 text-primary-foreground lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -right-20 top-10 h-44 w-44 rounded-full bg-primary-foreground/20 blur-2xl" />
            <div className="absolute -left-24 bottom-16 h-56 w-56 rounded-full bg-primary-foreground/15 blur-3xl" />
          </div>

          <Link href={marketingBaseUrl} className="relative inline-flex items-center gap-2 text-primary-foreground/95">
            <Image src="/logo.svg" alt="Beres logo" width={106} height={28} className="h-7 w-auto brightness-0 invert" />
          </Link>

          <div className="relative mt-11 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-foreground/75">Business Onboarding</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Setup usaha lebih rapi, siap dipakai dari hari pertama.
            </h1>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Ikuti empat langkah setup untuk menyiapkan organisasi, mode bisnis, cabang pertama, dan tim awal.
            </p>
          </div>

          <div className="relative mt-8 space-y-3 text-sm">
            <div className="rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 backdrop-blur">
              <p className="font-semibold">1. Profil organisasi</p>
              <p className="mt-1 text-primary-foreground/80">Nama usaha, tipe bisnis, dan fondasi akses tim.</p>
            </div>
            <div className="rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 backdrop-blur">
              <p className="font-semibold">2. Mode bisnis</p>
              <p className="mt-1 text-primary-foreground/80">Pilih single branch atau multi branch.</p>
            </div>
            <div className="rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 backdrop-blur">
              <p className="font-semibold">3. Cabang pertama</p>
              <p className="mt-1 text-primary-foreground/80">Alamat lengkap, wilayah operasional, kontak, dan jam operasional.</p>
            </div>
            <div className="rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 backdrop-blur">
              <p className="font-semibold">4. Invite team</p>
              <p className="mt-1 text-primary-foreground/80">Opsional, bisa dilewati dan dilanjutkan nanti.</p>
            </div>
          </div>

          <p className="relative mt-auto text-xs text-primary-foreground/75">
            Data onboarding langsung dipakai untuk transaksi, role, dan laporan operasional.
          </p>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-8">
            <p className="text-sm font-medium text-muted-foreground">Welcome to Beres App</p>
            <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground">
              <Link href={`${marketingBaseUrl}/privacy`} className="transition-colors hover:text-foreground">
                Privacy
              </Link>
              <Link href={`${marketingBaseUrl}/terms`} className="transition-colors hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>

          <OnboardingProgress />

          <div className="min-h-0 flex-1 px-4 py-4 md:px-6 md:py-5">
            <div className="mx-auto flex h-full w-full max-w-[920px] items-center justify-center">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
