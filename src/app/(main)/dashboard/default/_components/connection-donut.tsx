"use client";

import { Cell, Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { Counts, VehicleConnection } from "@/types/admin";

import { LegendSwatch } from "./legend-swatch";
import { STATUS } from "./viz";

/** États de connexion = des STATUTS : couleurs d'état, toujours doublées d'un libellé. */
const STATES = [
  {
    key: "online",
    label: "En ligne",
    hint: "trame récente",
    theme: STATUS.good,
  },
  {
    key: "idle",
    label: "Inactif",
    hint: "moteur coupé, émet encore",
    theme: STATUS.warning,
  },
  {
    key: "offline",
    label: "Hors ligne",
    hint: "signal perdu",
    theme: STATUS.critical,
  },
  {
    key: "never_seen",
    label: "Jamais vu",
    hint: "aucune position reçue",
    theme: STATUS.neutral,
  },
] as const satisfies ReadonlyArray<{
  key: VehicleConnection;
  label: string;
  hint: string;
  theme: unknown;
}>;

const config = Object.fromEntries(STATES.map((s) => [s.key, { label: s.label, theme: s.theme }])) satisfies ChartConfig;

/**
 * Part-à-tout à 4 segments au plus : le donut est lisible d'un coup d'œil.
 * Le total est au centre ; la légende porte les valeurs exactes.
 */
export function ConnectionDonut({
  counts,
  loading,
}: {
  counts: Counts<VehicleConnection> | undefined;
  loading: boolean;
}) {
  const data = STATES.map((s) => ({ ...s, value: counts?.[s.key] ?? 0 }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const online = data[0].value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats des véhicules connectés</CardTitle>
        <CardDescription>Dernier état remonté par chaque véhicule</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {loading && !counts ? (
          <Skeleton className="mx-auto size-52 rounded-full" />
        ) : (
          <ChartContainer config={config} className="mx-auto aspect-square h-52">
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  if (!active || !p) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="font-semibold text-sm tabular-nums">{formatNumber(p.value)} véhicules</div>
                      <div className="text-muted-foreground">
                        {p.label} · {total > 0 ? Math.round((p.value / total) * 100) : 0} %
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={total > 0 ? data : [{ key: "empty", label: "", value: 1 }]}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={total > 0 ? 2 : 0}
                cornerRadius={4}
                stroke="var(--card)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {(total > 0 ? data : [{ key: "empty" }]).map((d) => (
                  <Cell key={d.key} fill={d.key === "empty" ? "var(--muted)" : `var(--color-${d.key})`} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox)) return null;
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy - 6} className="fill-foreground font-semibold text-3xl">
                          {total > 0 ? `${Math.round((online / total) * 100)} %` : "—"}
                        </tspan>
                        <tspan x={cx} y={cy + 18} className="fill-muted-foreground text-xs">
                          en ligne
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}

        <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
          {data.map((d) => (
            <li key={d.key} className="flex items-start gap-2">
              <LegendSwatch theme={d.theme} />
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 text-sm">
                  <span>{d.label}</span>
                  <span className="font-medium tabular-nums">{formatNumber(d.value)}</span>
                </div>
                <div className="truncate text-muted-foreground text-xs">{d.hint}</div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
