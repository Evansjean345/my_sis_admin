"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@shared/components/ui/chart";
import { Skeleton } from "@shared/components/ui/skeleton";
import { AXIS_TICK, SERIES } from "@shared/features/home-platform/viz";
import { formatNumber } from "@shared/lib/format";
import type { OrganizationStatsRow } from "@shared/types/admin";

const config = { vehicles: { label: "Véhicules", theme: SERIES.blue } } satisfies ChartConfig;
const TOP = 8;

/**
 * Taille des flottes par client. Une seule série → une seule teinte ; la
 * valeur est écrite au bout de chaque barre. Cliquer une barre filtre tout
 * le tableau de bord sur cette organisation.
 */
export function OrganizationsChart({
  rows,
  loading,
  selectedId,
  onSelect,
}: {
  rows: OrganizationStatsRow[] | undefined;
  loading: boolean;
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  const sorted = [...(rows ?? [])].sort((a, b) => b.vehicles - a.vehicles || a.name.localeCompare(b.name));
  const top = sorted.slice(0, TOP);
  const others = sorted.slice(TOP);
  const data = [
    ...top.map((o) => ({ id: o.id, name: o.name, vehicles: o.vehicles, devices: o.devices, users: o.users })),
    ...(others.length > 0
      ? [
          {
            id: "",
            name: `Autres (${others.length})`,
            vehicles: others.reduce((s, o) => s + o.vehicles, 0),
            devices: others.reduce((s, o) => s + o.devices, 0),
            users: others.reduce((s, o) => s + o.users, 0),
          },
        ]
      : []),
  ];
  const height = Math.max(data.length * 36 + 8, 120);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flottes par organisation</CardTitle>
        <CardDescription>Nombre de véhicules · cliquer une barre filtre le tableau de bord</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !rows ? (
          <Skeleton className="h-60 w-full" />
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">Aucune organisation.</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }} barSize={18}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={148}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  if (!active || !p) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="font-semibold text-sm tabular-nums">{formatNumber(p.vehicles)} véhicules</div>
                      <div className="text-muted-foreground">{p.name}</div>
                      <div className="mt-1 text-muted-foreground tabular-nums">
                        {formatNumber(p.devices)} boîtiers · {formatNumber(p.users)} comptes
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="vehicles"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
                className="cursor-pointer"
                onClick={(entry: { payload?: { id?: string } }) => {
                  const id = entry.payload?.id;
                  if (id) onSelect(id === selectedId ? undefined : id);
                }}
              >
                {data.map((d) => (
                  <Cell
                    key={d.id || d.name}
                    fill="var(--color-vehicles)"
                    // Emphase : la sélection garde la teinte pleine, le reste s'efface.
                    fillOpacity={selectedId && d.id !== selectedId ? 0.3 : 1}
                  />
                ))}
                <LabelList
                  dataKey="vehicles"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(v: unknown) => formatNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
