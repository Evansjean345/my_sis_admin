"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { ActivityDay } from "@/types/admin";

import { LegendSwatch } from "./legend-swatch";
import { AXIS_TICK, formatDay, formatDayLong, GRID_PROPS, STATUS } from "./viz";

/** Résultat d'une commande = un STATUT (acquittée / échec / autre), jamais une « série ». */
const OUTCOMES = [
  { key: "acknowledged", label: "Acquittées", theme: STATUS.good },
  { key: "failed", label: "Échec ou expirées", theme: STATUS.critical },
  { key: "other", label: "En cours ou annulées", theme: STATUS.neutral },
] as const;

const config = Object.fromEntries(
  OUTCOMES.map((o) => [o.key, { label: o.label, theme: o.theme }]),
) satisfies ChartConfig;

/**
 * Commandes par jour, empilées par résultat. L'empilement garde le total
 * lisible (hauteur de la colonne) ; l'écart de 2 px entre segments les sépare
 * sans trait de contour.
 */
export function CommandsChart({ days, loading }: { days: ActivityDay[] | undefined; loading: boolean }) {
  const data = (days ?? []).map((d) => ({ date: d.date, ...d.commands }));
  const totals = OUTCOMES.map((o) => ({
    ...o,
    value: data.reduce((s, d) => s + d[o.key], 0),
  }));
  const all = totals.reduce((s, t) => s + t.value, 0);
  // Barres plus fines au-delà de 30 jours : ≤ 24 px, jamais le créneau entier.
  const barSize = data.length > 45 ? 6 : data.length > 20 ? 12 : 22;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commandes envoyées aux boîtiers</CardTitle>
        <CardDescription>
          {formatNumber(all)} commandes sur la période ci-dessous ·{" "}
          {all > 0 ? `${Math.round((totals[0].value / all) * 100)} % acquittées` : "aucune commande"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {totals.map((t) => (
            <li key={t.key} className="flex items-start gap-2 text-sm">
              <LegendSwatch theme={t.theme} />
              <span className="text-muted-foreground">{t.label}</span>
              <span className="font-medium tabular-nums">{formatNumber(t.value)}</span>
            </li>
          ))}
        </ul>
        {loading && data.length === 0 ? (
          <Skeleton className="h-60 w-full" />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-60 w-full">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barSize={barSize}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
                tick={AXIS_TICK}
              />
              <YAxis width={36} tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  if (!active || !p) return null;
                  return (
                    <div className="min-w-44 rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="mb-1.5 text-muted-foreground capitalize">{formatDayLong(p.date)}</div>
                      {OUTCOMES.map((o) => (
                        <div key={o.key} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span
                              aria-hidden="true"
                              className="h-0.5 w-3 rounded-full"
                              style={{ background: `var(--color-${o.key})` }}
                            />
                            {o.label}
                          </span>
                          <span className="font-semibold tabular-nums">{formatNumber(p[o.key])}</span>
                        </div>
                      ))}
                      <div className="mt-1.5 flex justify-between border-t pt-1.5">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold tabular-nums">{formatNumber(p.total)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              {OUTCOMES.map((o, i) => (
                <Bar
                  key={o.key}
                  dataKey={o.key}
                  stackId="outcome"
                  fill={`var(--color-${o.key})`}
                  stroke="var(--card)"
                  strokeWidth={1}
                  // Seul le segment du haut porte l'arrondi (4 px), la base reste carrée.
                  radius={i === OUTCOMES.length - 1 ? [4, 4, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
