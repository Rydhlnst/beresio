import { createDbNextjs, branches, member } from "@beresio/db";
import { and, eq, sql } from "drizzle-orm";
import { SectionCard } from "../shared/section-card";
import { CardEmptyState } from "../shared/card-empty-state";
import { MapPin } from "lucide-react";

type OperationsStatusCardProps = {
    organizationId?: string | null;
};

export async function OperationsStatusCard({ organizationId }: OperationsStatusCardProps) {
    if (!organizationId) {
        return (
            <SectionCard title="Operasional" className="h-full">
                <CardEmptyState
                    icon={MapPin}
                    title="Belum ada cabang aktif"
                />
            </SectionCard>
        );
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL is missing from environment");

    const db = createDbNextjs(dbUrl);

    const [totalBranchesRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(eq(branches.organizationId, organizationId));

    const [activeBranchesRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(and(
            eq(branches.organizationId, organizationId),
            eq(branches.isActive, true)
        ));

    const [memberCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(member)
        .where(eq(member.organizationId, organizationId));

    const activeBranches = await db
        .select({
            id: branches.id,
            name: branches.name,
        })
        .from(branches)
        .where(and(
            eq(branches.organizationId, organizationId),
            eq(branches.isActive, true)
        ))
        .limit(3)
        .orderBy(branches.name);

    const totalBranches = Number(totalBranchesRow?.count ?? 0);
    const activeBranchesCount = Number(activeBranchesRow?.count ?? 0);
    const memberCount = Number(memberCountRow?.count ?? 0);

    return (
        <SectionCard
            title="Operasional"
            className="h-full"
            description="Cabang aktif dan tim yang sedang bertugas."
        >
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Cabang aktif
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                            {activeBranchesCount}/{totalBranches}
                        </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Anggota tim
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                            {memberCount}
                        </p>
                    </div>
                </div>

                {activeBranchesCount === 0 ? (
                    <CardEmptyState
                        icon={MapPin}
                        title="Belum ada cabang aktif"
                    />
                ) : (
                    <div className="space-y-2 border-t border-border/40 pt-3">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Cabang operasional
                        </p>
                        <ul className="space-y-2">
                            {activeBranches.map((branch) => (
                                <li key={branch.id} className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-foreground">{branch.name}</span>
                                    <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                        Aktif
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </SectionCard>
    );
}




