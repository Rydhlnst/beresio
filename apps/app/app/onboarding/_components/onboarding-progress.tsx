"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "org",
    title: "Profil Usaha",
    helper: "Data bisnis",
    matcher: "/onboarding/org",
  },
  {
    key: "branch",
    title: "Cabang Pertama",
    helper: "Lokasi & jam operasional",
    matcher: "/onboarding/branch",
  },
  {
    key: "products",
    title: "Produk Awal",
    helper: "Opsional",
    matcher: "/onboarding/products",
  },
  {
    key: "team",
    title: "Undang Tim",
    helper: "Opsional",
    matcher: "/onboarding/team",
  },
] as const;

export function OnboardingProgress() {
  const pathname = usePathname();

  const activeIndex = STEPS.findIndex((step) => pathname.includes(step.matcher));
  const resolvedIndex = activeIndex < 0 ? 0 : activeIndex;
  const progress = ((resolvedIndex + 1) / STEPS.length) * 100;

  return (
    <div className="border-b border-border px-5 py-4 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Onboarding Setup</p>
        <p className="text-xs font-medium text-muted-foreground">
          Step {resolvedIndex + 1} dari {STEPS.length}
        </p>
      </div>

      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {STEPS.map((step, index) => {
          const completed = index < resolvedIndex;
          const active = index === resolvedIndex;

          return (
            <li
              key={step.key}
              className={cn(
                "rounded-xl border px-3 py-2 transition-colors",
                completed && "border-primary/25 bg-primary/10",
                active && "border-primary/40 bg-primary/15",
                !completed && !active && "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                    completed && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary text-primary",
                    !completed && !active && "border-border text-muted-foreground"
                  )}
                >
                  {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.helper}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
