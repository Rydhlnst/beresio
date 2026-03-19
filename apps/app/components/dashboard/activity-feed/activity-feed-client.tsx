"use client";

import { useState } from "react";
import { type ActivityType } from "./types";
import { SectionCard } from "../shared/section-card";
import { ActivityItem } from "./activity-item";
import { CardEmptyState } from "../shared/card-empty-state";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type Filter = "Semua" | "Order" | "Staff" | "Alert";
const FILTERS: Filter[] = ["Semua", "Order", "Staff", "Alert"];

const filterMap: Record<Filter, string | null> = {
    Semua: null,
    Order: "order",
    Staff: "staff",
    Alert: "alert",
};

export function ActivityFeedClient({ data }: { data: any[] }) {
    const [activeFilter, setActiveFilter] = useState<Filter>("Semua");

    const filtered = data.filter((item) => {
        const typeFilter = filterMap[activeFilter];
        return typeFilter === null || item.type === typeFilter;
    });

    return (
        <SectionCard
            title="Aktivitas Real-time"
            className="h-full"
            actions={
                <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 p-1">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ease-out",
                                activeFilter === f
                                    ? "bg-background text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            }
        >
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {filtered.length === 0 ? (
                    <CardEmptyState
                        icon={Activity}
                        title="Belum ada aktivitas hari ini"
                    />
                ) : (
                    filtered.map((item) => (
                        <ActivityItem
                            key={item.id}
                            icon={item.icon || ""}
                            description={item.description}
                            branch={item.branch}
                            timeAgo={item.timeAgo}
                            type={item.type as ActivityType}
                        />
                    ))
                )}
            </div>
        </SectionCard>
    );
}
