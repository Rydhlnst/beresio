import { cn } from "@/lib/utils";

interface RoleChipProps {
    role: string;
    count: number;
    className?: string;
}

export function RoleChip({ role, count, className }: RoleChipProps) {
    return (
        <span className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-semibold text-foreground/80",
            className
        )}>
            {role}
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted/70 text-[10px] font-semibold text-foreground">
                {count}
            </span>
        </span>
    );
}
