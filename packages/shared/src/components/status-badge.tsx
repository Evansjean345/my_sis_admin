import { cn } from "cn";

import { Badge } from "@shared/components/ui/badge";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "orange";

const toneClasses: Record<StatusTone, { badge: string; dot: string }> = {
  success: {
    badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  warning: {
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  orange: {
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  danger: {
    badge: "border-destructive/20 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  info: {
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  neutral: {
    badge: "border-border bg-muted/50 text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export function StatusBadge({
  tone,
  children,
  className,
  dot = true,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  const classes = toneClasses[tone];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-sm border px-2 py-0.5 font-medium", classes.badge, className)}
    >
      {dot ? <span aria-hidden="true" className={cn("size-1.5 rounded-full", classes.dot)} /> : null}
      {children}
    </Badge>
  );
}
