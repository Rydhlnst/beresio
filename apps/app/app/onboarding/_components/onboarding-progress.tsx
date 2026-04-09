"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const STEPS = [
  {
    key: "org",
    title: "Profil Usaha",
    helper: "Data organisasi",
    matcher: "/onboarding/org",
  },
  {
    key: "team",
    title: "Cabang Pertama",
    helper: "Lokasi operasional",
    matcher: "/onboarding/team",
  },
] as const;

export function OnboardingProgress() {
  const pathname = usePathname();

  const activeIndex = STEPS.findIndex((step) => pathname.includes(step.matcher));
  const resolvedIndex = activeIndex < 0 ? 0 : activeIndex;
  const progress = ((resolvedIndex + 1) / STEPS.length) * 100;

  return (
    <div className="border-b border-slate-200/90 px-6 py-5 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Onboarding Setup</p>
        <p className="text-xs font-medium text-slate-500">
          Step {resolvedIndex + 1} of {STEPS.length}
        </p>
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2E5BFF] to-[#1F47DF] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, index) => {
          const completed = index < resolvedIndex;
          const active = index === resolvedIndex;

          return (
            <li
              key={step.key}
              className={cn(
                "rounded-xl border px-3 py-2 transition-colors",
                completed && "border-blue-200 bg-blue-50/60",
                active && "border-blue-300 bg-blue-50",
                !completed && !active && "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                    completed && "border-blue-600 bg-blue-600 text-white",
                    active && "border-blue-600 text-blue-700",
                    !completed && !active && "border-slate-300 text-slate-500"
                  )}
                >
                  {completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-xs text-slate-500">{step.helper}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
