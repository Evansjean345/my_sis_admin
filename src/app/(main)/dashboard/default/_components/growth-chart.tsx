"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { ActivityDay } from "@/types/admin";

import { LegendSwatch } from "./legend-swatch";
import { AXIS_TICK, formatDay, formatDayLong, GRID_PROPS, SERIES } from "./viz";

/** Trois séries, trois premières teintes de la palette — ordre fixe, jamais selon le classement. */
const LINES = [
  { key: "vehicles", label: "Véhicules", theme: SERIES.blue },
  { key: "devices", label: "Boîtiers", theme: SERIES.orange },
  { key: "users", label: "Comptes", theme: SERIES.aqua },
] as const;

const config = Object.fromEntries(LINES.map((l) => [l.key, { label: l.label, theme: l.theme }])) satisfies ChartConfig;

/**
 * Effectifs cumulés en fin de journée. Même unité (un nombre d'éléments) pour
 * les trois séries : un seul axe, sans artifice.
 */
export function GrowthChart({ days, loading }: { days: ActivityDay[] | undefined; loading: boolean }) {
  const data = (days ?? []).map((d) => ({
    date: d.date,
    ...d.totals,
    created: d.created,
  }));
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Croissance du parc Auto</CardTitle>
        <CardDescription>Effectifs cumulés en fin de journée</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="grid grid-cols-3 gap-3">
          {LINES.map((l) => {
            const added = last && first ? last[l.key] - first[l.key] + (first.created[l.key] ?? 0) : 0;
            return (
              <li key={l.key} className="flex items-start gap-2">
                <LegendSwatch theme={l.theme} shape="line" />
                <div className="min-w-0">
                  <div className="text-muted-foreground text-xs">{l.label}</div>
                  <div className="font-semibold text-lg tabular-nums leading-tight">
                    {formatNumber(last?.[l.key] ?? 0)}
                  </div>
                  <div className="text-muted-foreground text-xs">+{formatNumber(added)} sur la période</div>
                </div>
              </li>
            );
          })}
        </ul>
        {loading && data.length === 0 ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  if (!active || !p) return null;
                  return (
                    <div className="min-w-40 rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="mb-1.5 text-muted-foreground capitalize">{formatDayLong(p.date)}</div>
                      {LINES.map((l) => (
                        <div key={l.key} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span
                              aria-hidden="true"
                              className="h-0.5 w-3 rounded-full"
                              style={{ background: `var(--color-${l.key})` }}
                            />
                            {l.label}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatNumber(p[l.key])}
                            {p.created[l.key] > 0 ? (
                              <span className="font-normal text-muted-foreground"> (+{p.created[l.key]})</span>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {LINES.map((l) => (
                <Line
                  key={l.key}
                  dataKey={l.key}
                  type="stepAfter"
                  stroke={`var(--color-${l.key})`}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
