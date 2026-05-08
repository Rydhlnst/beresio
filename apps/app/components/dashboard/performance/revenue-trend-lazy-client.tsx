"use client";

import dynamic from "next/dynamic";
import { ChartCardSkeleton } from "./chart-card-skeleton";

type RevenueTrendClientProps = {
    initialData7d: any[];
    initialData30d: any[];
};

const RevenueTrendClient = dynamic<RevenueTrendClientProps>(
    () => import("./revenue-trend-client").then((mod) => mod.RevenueTrendClient),
    {
        ssr: false,
        loading: () => <ChartCardSkeleton title="Tren Revenue" />,
    }
);

export function RevenueTrendLazyClient(props: RevenueTrendClientProps) {
    return <RevenueTrendClient {...props} />;
}
