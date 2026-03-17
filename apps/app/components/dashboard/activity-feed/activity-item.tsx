import { cn } from "@/lib/utils";
import { type ActivityType } from "./types";
import { Package, User, AlertCircle, ShieldCheck } from "lucide-react";

interface ActivityItemProps {
    icon: string;
    description: string;
    branch: string;
    timeAgo: string;
    type: ActivityType;
}

const typeConfig: Record<ActivityType, { tone: string; icon: any }> = {
    order: { tone: "text-muted-foreground", icon: Package },
    staff: { tone: "text-muted-foreground", icon: User },
    alert: { tone: "text-primary", icon: AlertCircle },
    system: { tone: "text-muted-foreground", icon: ShieldCheck },
};

export function ActivityItem({ description, branch, timeAgo, type }: ActivityItemProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0">
            <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-md border border-border/60 bg-muted/40 flex items-center justify-center",
                config.tone
            )}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{description}</p>
                <p className="text-xs text-muted-foreground mt-2">{branch}</p>
            </div>
            <span className="text-xs text-muted-foreground/70 flex-shrink-0">{timeAgo}</span>
        </div>
    );
}
