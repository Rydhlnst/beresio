import { SectionCard } from "../shared/section-card";
import { Button } from "@repo/ui/button";
import { ArrowUpRight, Plus, SlidersHorizontal, Sparkles } from "lucide-react";

export function DashboardHighlightCard() {
    return (
        <SectionCard
            title="Sorotan Utama"
            description="Ringkasan cepat untuk fokus hari ini."
            actions={(
                <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 px-3 text-xs font-semibold" asChild>
                        <a href="/dashboard/highlights/new">
                            <Plus className="h-3 w-3" />
                            Tambah
                        </a>
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs font-semibold"
                        asChild
                    >
                        <a href="/dashboard/highlights">
                            <SlidersHorizontal className="h-3 w-3" />
                            Atur
                        </a>
                    </Button>
                </div>
            )}
        >
            <div className="flex h-full flex-col gap-4">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Dashboard siap dipakai</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tambahkan insight penting di sini untuk tim.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Aksi cepat
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="outline"
                            className="h-9 w-full justify-between text-xs font-semibold"
                            asChild
                        >
                            <a href="/dashboard/reports">
                                Lihat laporan
                                <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-9 w-full justify-between text-xs font-semibold"
                            asChild
                        >
                            <a href="/settings/billing">
                                Kelola paket
                                <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </SectionCard>
    );
}
