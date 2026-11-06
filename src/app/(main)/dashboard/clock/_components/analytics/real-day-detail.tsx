"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { LegendSwatch } from "@/app/(main)/dashboard/default/_components/legend-swatch";
import { AXIS_TICK, GRID_PROPS, SERIES } from "@/app/(main)/dashboard/default/_components/viz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ScheduleHistoryDay } from "@/types/schedule";

import type { DayForecast } from "./forecast";
import { formatDayLong } from "./format";

const config = {
  cut: { label: "Coupures", theme: SERIES.blue },
  restore: { label: "Rétablissements", theme: SERIES.aqua },
  refused: { label: "Refus", theme: SERIES.orange },
} satisfies ChartConfig;

const SERIES_KEYS = ["cut", "restore", "refused"] as const;
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

/**
 * Journée sélectionnée, historique réel : ce qui était prévu, ce que le
 * moteur a émis, ce que les boîtiers ont confirmé — puis heure par heure.
 */
export function RealDayDetail({ day, planned }: { day: ScheduleHistoryDay; planned: DayForecast | undefined }) {
  const data = HOURS.map((label, h) => ({
    label,
    cut: day.hours.cut[h] ?? 0,
    restore: day.hours.restore[h] ?? 0,
    refused: day.hours.refused[h] ?? 0,
  }));
  const rows = [
    {
      label: "Coupures",
      planned: planned?.cutsPlanned,
      issued: day.cut.requested,
      confirmed: day.cut.acknowledged,
      failed: day.cut.failed + day.cut.expired,
    },
    {
      label: "Rétablissements",
      planned: planned?.restoresPlanned,
      issued: day.restore.requested,
      confirmed: day.restore.acknowledged,
      failed: day.restore.failed + day.restore.expired,
    },
  ];
  const empty = day.cut.requested + day.restore.requested + day.refusals + day.overrides === 0;

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <CardTitle className="capitalize">{formatDayLong(day.date)}</CardTitle>
        <CardDescription>
          {empty
            ? "Aucune activité du moteur planifié ce jour-là."
            : `${day.refusals} refus · ${day.overrides} dérogation(s) opérateur · ${day.manualCutsKept} coupure(s) manuelle(s) conservée(s)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <table className="w-full text-sm tabular-nums">
          <caption className="sr-only">Prévu, émis et confirmé ce jour-là</caption>
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th scope="col" className="pb-1 text-left font-normal">
                <span className="sr-only">Commande</span>
              </th>
              <th scope="col" className="pb-1 text-right font-normal">
                Prévues
              </th>
              <th scope="col" className="pb-1 text-right font-normal">
                Émises
              </th>
              <th scope="col" className="pb-1 text-right font-normal">
                Confirmées
              </th>
              <th scope="col" className="pb-1 text-right font-normal">
                Échecs
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t">
                <th scope="row" className="py-1.5 text-left font-medium">
                  {r.label}
                </th>
                <td className="py-1.5 text-right text-muted-foreground">{r.planned ?? "—"}</td>
                <td className="py-1.5 text-right">{r.issued}</td>
                <td className="py-1.5 text-right font-semibold">{r.confirmed}</td>
                <td className="py-1.5 text-right">
                  {r.failed > 0 ? <span className="text-destructive">{r.failed}</span> : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="-mt-3 text-muted-foreground text-xs">
          « Prévues » : transitions calculées avec les calendriers actuels. Un calendrier modifié depuis fausse la
          comparaison des jours passés.
        </p>

        <figure className="flex flex-col gap-2">
          <figcaption className="text-muted-foreground text-xs">Activité du moteur, heure par heure</figcaption>
          <ChartContainer config={config} className="aspect-auto h-40 w-full">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} interval={2} tick={AXIS_TICK} />
              <YAxis width={28} tickLine={false} axisLine={false} allowDecimals={false} tick={AXIS_TICK} />
              <ChartTooltip
                cursor={{ fill: "var(--muted-foreground)", opacity: 0.08 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined;
                  if (!active || !p) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="mb-1 text-muted-foreground">
                        {p.label}h00 – {p.label}h59
                      </div>
                      {SERIES_KEYS.map((k) => (
                        <div key={k} className="flex items-center justify-between gap-4 tabular-nums">
                          <span className="flex items-center gap-1.5">
                            <LegendSwatch theme={config[k].theme} />
                            {config[k].label}
                          </span>
                          <span className="font-semibold">{p[k]}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              {SERIES_KEYS.map((k, i) => (
                <Bar
                  key={k}
                  dataKey={k}
                  stackId="activite"
                  fill={`var(--color-${k})`}
                  radius={i === SERIES_KEYS.length - 1 ? [3, 3, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ChartContainer>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
            {SERIES_KEYS.map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <LegendSwatch theme={config[k].theme} />
                {config[k].label}
              </li>
            ))}
          </ul>
        </figure>
      </CardContent>
    </Card>
  );
}
