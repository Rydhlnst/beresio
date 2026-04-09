"use client";

import dynamic from "next/dynamic";
import { ChartCardSkeleton } from "./chart-card-skeleton";

type RevenueBranchClientProps = {
    data: any[];
};

const RevenueBranchClient = dynamic<RevenueBranchClientProps>(
    () => import("./revenue-branch-client").then((mod) => mod.RevenueBranchClient),
    {
        ssr: false,
        loading: () => <ChartCardSkeleton title="Revenue per Cabang" />,
    }
);

export function RevenueBranchLazyClient(props: RevenueBranchClientProps) {
    return <RevenueBranchClient {...props} />;
}
