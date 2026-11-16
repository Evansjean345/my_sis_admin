"use client";

import { useState } from "react";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@shared/components/ui/chart";
import { Skeleton } from "@shared/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@shared/components/ui/toggle-group";
import {
  AXIS_TICK,
  formatCompact,
  formatDay,
  formatDayLong,
  GRID_PROPS,
  SERIES,
} from "@shared/features/home-platform/viz";
import { formatNumber } from "@shared/lib/format";
import type { ActivityDay } from "@shared/types/admin";

/**
 * Une mesure à la fois : trames, véhicules actifs, distance ou trajets n'ont
 * pas la même échelle — les superposer imposerait deux axes Y, qui inventent
 * des corrélations. Le sélecteur change la mesure, l'axe suit.
 */
const METRICS = {
  positions: { label: "Positions GPS", unit: "", pick: (d: ActivityDay) => d.positions },
  activeVehicles: { label: "Véhicules actifs", unit: "", pick: (d: ActivityDay) => d.activeVehicles },
  distanceKm: { label: "Distance", unit: " km", pick: (d: ActivityDay) => d.distanceKm },
  trips: { label: "Trajets", unit: "", pick: (d: ActivityDay) => d.trips },
} as const;

type Metric = keyof typeof METRICS;

const config = { value: { label: "Valeur", theme: SERIES.blue } } satisfies ChartConfig;

export function ActivityChart({ days, loading }: { days: ActivityDay[] | undefined; loading: boolean }) {
  const [metric, setMetric] = useState<Metric>("positions");
  const m = METRICS[metric];
  const data = (days ?? []).map((d) => ({ date: d.date, value: m.pick(d) }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const peak = data.reduce<(typeof data)[number] | null>((best, d) => (!best || d.value > best.value ? d : best), null);

  return (
    <Card className="@container/activity">
      <CardHeader>
        <CardTitle>Activité de la flotte</CardTitle>
        <CardDescription>
          {data.length > 0 ? (
            <>
              {m.label} par jour · total{" "}
              <span className="font-medium text-foreground">
                {formatNumber(Math.round(total))}
                {m.unit}
              </span>
              {peak && peak.value > 0 ? (
                <>
                  {" "}
                  · pic le {formatDay(peak.date)} ({formatNumber(Math.round(peak.value))}
                  {m.unit})
                </>
              ) : null}
            </>
          ) : (
            "Chargement de la période…"
          )}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={metric}
            onValueChange={(v) => v && setMetric(v as Metric)}
            aria-label="Mesure affichée"
            className="hidden @[560px]/activity:flex"
          >
            {(Object.keys(METRICS) as Metric[]).map((k) => (
              <ToggleGroupItem key={k} value={k} className="px-3">
                {METRICS[k].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Sur écran étroit, le sélecteur passe sous le titre. */}
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={metric}
          onValueChange={(v) => v && setMetric(v as Metric)}
          aria-label="Mesure affichée"
          className="flex flex-wrap @[560px]/activity:hidden"
        >
          {(Object.keys(METRICS) as Metric[]).map((k) => (
            <ToggleGroupItem key={k} value={k} className="px-2.5 text-xs">
              {METRICS[k].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {loading && data.length === 0 ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <ChartContainer config={config} className="aspect-auto h-72 w-full">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
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
              <YAxis
                width={44}
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as { date: string; value: number } | undefined;
                  if (!active || !point) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="font-semibold text-sm tabular-nums">
                        {formatNumber(point.value, 1)}
                        {m.unit}
                      </div>
                      <div className="text-muted-foreground">
                        {m.label} · <span className="capitalize">{formatDayLong(point.date)}</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={2}
                fill="url(#activity-fill)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
