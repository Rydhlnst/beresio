"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TimeRange = "7D" | "30D" | "3M";

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
    className?: string;
}

const ranges: TimeRange[] = ["7D", "30D", "3M"];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
    return (
        <div className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/80 p-1",
            className
        )}>
            {ranges.map((range) => (
                <button
                    key={range}
                    type="button"
                    suppressHydrationWarning
                    onClick={() => onChange(range)}
                    className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out",
                        value === range
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {range}
                </button>
            ))}
        </div>
    );
}

export type { TimeRange };
