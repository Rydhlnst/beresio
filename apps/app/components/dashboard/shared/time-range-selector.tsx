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
            "inline-flex items-center rounded-md border border-border/60 bg-muted/40 p-1 gap-1",
            className
        )}>
            {ranges.map((range) => (
                <button
                    key={range}
                    onClick={() => onChange(range)}
                    className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ease-out",
                        value === range
                            ? "bg-background text-foreground"
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
