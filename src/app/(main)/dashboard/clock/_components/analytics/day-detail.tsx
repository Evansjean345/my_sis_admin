"use client";

import Link from "next/link";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { AXIS_TICK, GRID_PROPS, SERIES, STATUS } from "@/app/(main)/dashboard/default/_components/viz";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";

import { ModeBadge } from "../../../_components/schedules/schedule-badges";
import { type DayForecast, occurrences } from "./forecast";
import { formatClock, formatDayLong, formatHours, formatVehicles } from "./format";
import type { ScheduleStat } from "./model";

const config = {
  vehicles: { label: "Véhicules immobilisés", theme: SERIES.blue },
  now: { label: "Heure en cours", theme: STATUS.warning },
} satisfies ChartConfig;

/**
 * Journée sélectionnée : profil horaire (véhicules immobilisés en moyenne
 * sur chaque heure) et calendriers en vigueur, plages converties dans le
 * fuseau d'affichage.
 */
export function DayDetail({
  day,
  stats,
  displayTz,
  now,
}: {
  day: DayForecast;
  stats: ScheduleStat[];
  displayTz: string;
  now: number;
}) {
  const isToday = now >= day.start && now < day.end;
  const data = day.hours.map((value, i) => {
    const start = day.hourStarts[i];
    const end = day.hourStarts[i + 1] ?? day.end;
    return {
      label: formatClock(start, displayTz).slice(0, 2),
      value,
      start,
      end,
      current: isToday && now >= start && now < end,
    };
  });

  const inForce = stats
    .filter((s) => !s.withoutEffect)
    .map((s) => ({ stat: s, ranges: occurrences(s.schedule, day.start, day.end) }));

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <CardTitle className="capitalize">{formatDayLong(day.date)}</CardTitle>
        <CardDescription>
          {day.affected > 0
            ? `${formatVehicles(day.affected)} véhicule(s) concerné(s) · ${formatHours(day.vehicleHours)} d'immobilisation`
            : "Aucune immobilisation prévue ce jour-là."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Concernés</dt>
            <dd className="font-semibold text-lg tabular-nums">{formatVehicles(day.affected)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Pic simultané</dt>
            <dd className="font-semibold text-lg tabular-nums">
              {formatVehicles(day.peak)}
              {day.peakAt !== null ? (
                <span className="font-normal text-muted-foreground text-xs">
                  {" "}
                  à {formatClock(day.peakAt, displayTz)}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Heures-véhicule</dt>
            <dd className="font-semibold text-lg tabular-nums">{formatHours(day.vehicleHours)}</dd>
          </div>
        </dl>

        <figure className="flex flex-col gap-2">
          <figcaption className="text-muted-foreground text-xs">
            Véhicules immobilisés, en moyenne sur chaque heure
            {isToday ? " — l'heure en cours est en jaune" : ""}
          </figcaption>
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
                        {formatClock(p.start, displayTz)} – {p.end >= day.end ? "24:00" : formatClock(p.end, displayTz)}
                      </div>
                      <div className="font-semibold tabular-nums">{formatVehicles(p.value)} véhicule(s)</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {data.map((d) => (
                  <Cell key={d.start} fill={d.current ? "var(--color-now)" : "var(--color-vehicles)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </figure>

        <section className="flex flex-col gap-2">
          <h3 className="font-medium text-sm">Calendriers en vigueur</h3>
          {inForce.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun calendrier actif n'a de véhicule rattaché.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {inForce.map(({ stat, ranges }) => (
                <li key={stat.schedule.id} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/clock/${stat.schedule.id}`}
                      prefetch={false}
                      className="font-medium text-sm hover:underline"
                    >
                      {stat.schedule.name}
                    </Link>
                    {stat.vehiclesByMode.allowed > 0 ? <ModeBadge mode="allowed" /> : null}
                    {stat.vehiclesByMode.forbidden > 0 ? <ModeBadge mode="forbidden" /> : null}
                    <span className="text-muted-foreground text-xs">{stat.vehiclesCovered} véh.</span>
                  </div>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {ranges.length > 0 ? (
                      <>
                        Plages :{" "}
                        {ranges
                          .map(
                            ([s, e]) =>
                              `${formatClock(s, displayTz)}–${e >= day.end ? "24:00" : formatClock(e, displayTz)}`,
                          )
                          .join(", ")}
                      </>
                    ) : stat.vehiclesByMode.allowed > 0 ? (
                      <StatusBadge tone="danger" dot={false}>
                        Aucune plage autorisée : immobilisé toute la journée
                      </StatusBadge>
                    ) : (
                      "Aucune plage interdite ce jour-là"
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
