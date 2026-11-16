import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";

/** Tuile KPI au style des cartes du tableau de bord (icône, libellé, valeur 3xl). */
export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-medium text-2xl tabular-nums leading-none tracking-tight sm:text-3xl">{value}</div>
          {badge}
        </div>
        {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export const metricGridClass =
  "grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card";
