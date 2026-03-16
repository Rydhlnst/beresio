import { Skeleton } from "@repo/ui/skeleton";

/**
 * Loading skeleton untuk landing page.
 * Ditampilkan otomatis oleh Next.js App Router saat streaming atau navigasi antar halaman.
 */
export default function Loading() {
    return (
        <div className="w-full animate-pulse" aria-label="Memuat halaman...">
            {/* Hero skeleton */}
            <section className="px-6 sm:px-10 pt-16 pb-24 max-w-[1400px] mx-auto space-y-8">
                <Skeleton className="h-5 w-32 rounded-full" />
                <div className="space-y-4">
                    <Skeleton className="h-16 w-3/4 rounded-lg" />
                    <Skeleton className="h-16 w-1/2 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-2/3 rounded-md" />
                <div className="flex gap-4">
                    <Skeleton className="h-14 w-48 rounded-2xl" />
                    <Skeleton className="h-14 w-36 rounded-2xl" />
                </div>
                {/* Dashboard mockup skeleton */}
                <Skeleton className="w-full h-[480px] rounded-[2rem] mt-12" />
            </section>

            {/* Value Proposition skeleton */}
            <section className="px-6 sm:px-10 py-24 max-w-[1400px] mx-auto">
                <Skeleton className="h-4 w-40 rounded-full mb-4" />
                <Skeleton className="h-12 w-2/3 rounded-lg mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <Skeleton className="aspect-square rounded-[32px]" />
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-5 w-full rounded-md" />
                        <Skeleton className="h-5 w-5/6 rounded-md" />
                    </div>
                </div>
            </section>
        </div>
    );
}
