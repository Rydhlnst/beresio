"use client";

import { useEffect } from "react";
import { setActiveBranchClient } from "@/lib/active-branch-client";

type ActiveBranchSyncProps = {
    branchId?: string | null;
};

export function ActiveBranchSync({ branchId }: ActiveBranchSyncProps) {
    useEffect(() => {
        if (!branchId) return;
        setActiveBranchClient(branchId);
    }, [branchId]);

    return null;
}
