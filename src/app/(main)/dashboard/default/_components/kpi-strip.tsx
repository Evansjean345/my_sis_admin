"use client";

import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Car,
  Minus,
  Radio,
  Route,
  Send,
  Warehouse,
} from "lucide-react";
import { Area, AreaChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type {
  ActivityReport,
  CommandStats,
  DeviceStats,
  UserStats,
  VehicleStats,
} from "@/types/admin";

import { formatCompact, halfDelta, SERIES } from "./viz";

const sparkConfig = {
  value: { label: "Valeur", theme: SERIES.blue },
} satisfies ChartConfig;

/** Tendance de la fenêtre : 12 à 90 points, dans la teinte d'accent, sans axe. */
function Sparkline({ values, id }: { values: number[]; id: string }) {
  const data = values.map((value, index) => ({ index, value }));
  return (
    <ChartContainer
      config={sparkConfig}
      className="aspect-auto h-10 w-full"
      aria-hidden="true"
    >
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-value)"
              stopOpacity={0.18}
            />
            <stop
              offset="100%"
              stopColor="var(--color-value)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** Variation signée ; la couleur dit si la hausse est une bonne nouvelle. */
function Delta({
  value,
  upIsGood = true,
}: {
  value: number | null;
  upIsGood?: boolean;
}) {
  if (value === null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  const Icon =
    rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : Minus;
  const good = rounded === 0 ? null : rounded > 0 === upIsGood;
  const tone =
    good === null
      ? "text-muted-foreground"
      : good
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-red-700 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-medium text-xs ${tone}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {rounded > 0 ? "+" : ""}
      {rounded} %
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  delta,
  hint,
  trend,
  id,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  hint: ReactNode;
  trend?: number[];
  id: string;
}) {
  return (
    <Card className="gap-3 pb-0">
      <CardHeader className="gap-1">
        <CardDescription className="flex items-center gap-2">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </CardDescription>
        <CardTitle className="flex flex-wrap items-baseline gap-2 font-sans font-semibold text-2xl tracking-tight sm:text-3xl">
          {value}
          {delta}
        </CardTitle>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardHeader>
      <CardContent className="px-0">
        {trend ? (
          <Sparkline values={trend} id={id} />
        ) : (
          <div className="h-10" />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Cinq indicateurs de tête, chacun avec sa tendance sur la fenêtre choisie.
 * La variation compare la seconde moitié de la fenêtre à la première.
 */
export function KpiStrip({
  activity,
  vehicles,
  devices,
  users,
  commands,
  organizations,
  loading,
  days,
}: {
  activity: ActivityReport | undefined;
  vehicles: VehicleStats | undefined;
  devices: DeviceStats | undefined;
  users: UserStats | undefined;
  commands: CommandStats | undefined;
  organizations: number | undefined;
  loading: boolean;
  days: number;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const series = activity?.days ?? [];
  const pick = (f: (d: (typeof series)[number]) => number) => series.map(f);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

  const positions = pick((d) => d.positions);
  const distance = pick((d) => d.distanceKm);
  const active = pick((d) => d.activeVehicles);
  const sent = pick((d) => d.commands.total);
  const acknowledged = sum(pick((d) => d.commands.acknowledged));
  const failed = sum(pick((d) => d.commands.failed));
  const decided = acknowledged + failed;
  const successRate =
    decided > 0 ? Math.round((acknowledged / decided) * 100) : null;
  const fleet = pick((d) => d.totals.vehicles);
  // Croissance du parc sur la fenêtre (effectif de fin vs effectif de début).
  const fleetGrowth =
    fleet.length > 1 && fleet[0] > 0
      ? ((fleet[fleet.length - 1] - fleet[0]) / fleet[0]) * 100
      : null;

  const online = vehicles?.byConnection.online ?? 0;
  const totalVehicles = vehicles?.total ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      <div className="shadow-xl rounded-lg xl:hover:scale-95 transition-all cursor-pointer bg-[#0E508D]">
        <Kpi
          id="online"
          icon={Car}
          label="Véhicules en déplacement"
          value={
            <>
              {formatNumber(online)}
              <span className="font-normal text-base text-muted-foreground">
                / {formatNumber(totalVehicles)}
              </span>
            </>
          }
          hint={`Véhicules ayant émis chaque jour · ${days} j`}
          trend={active}
        />
      </div>
      <div className="shadow-xl rounded-lg xl:hover:scale-95 transition-all cursor-pointer bg-[#0E508D]">
        <Kpi
          id="positions"
          icon={Radio}
          label={`Positions GPS · ${days} j`}
          value={formatCompact(sum(positions))}
          delta={<Delta value={halfDelta(positions)} />}
          hint={`${formatCompact(Math.round(sum(positions) / Math.max(series.length, 1)))} par jour en moyenne`}
          trend={positions}
        />
      </div>
      <div className="shadow-xl rounded-lg xl:hover:scale-95 transition-all cursor-pointer bg-[#0E508D]">
        <Kpi
          id="distance"
          icon={Route}
          label={`Distance parcourue par la flotte · ${days} j`}
          value={`${formatNumber(Math.round(sum(distance)))} km`}
          delta={<Delta value={halfDelta(distance)} />}
          hint={`${formatNumber(sum(pick((d) => d.trips)))} trajets`}
          trend={distance}
        />
      </div>
      <div className="shadow-xl rounded-lg xl:hover:scale-95 transition-all cursor-pointer bg-[#0E508D]">
        <Kpi
          id="commands"
          icon={Send}
          label={`Commandes acquittées · ${days} j`}
          value={successRate === null ? "—" : `${successRate} %`}
          hint={`${formatNumber(sum(sent))} envoyées · ${formatNumber(failed)} en échec · ${formatNumber(commands?.inFlight ?? 0)} en vol`}
          trend={sent}
        />
      </div>
      <div className="shadow-xl rounded-lg xl:hover:scale-95 transition-all cursor-pointer bg-[#0E508D]">
        <Kpi
          id="fleet"
          icon={Warehouse}
          label="Parc auto"
          value={
            <>
              {formatNumber(totalVehicles)}
              <span className="font-normal text-base text-muted-foreground">
                véhicules
              </span>
            </>
          }
          delta={<Delta value={fleetGrowth} />}
          hint={`${formatNumber(devices?.total ?? 0)} boîtiers · ${formatNumber(users?.total ?? 0)} comptes${organizations === undefined ? "" : ` · ${formatNumber(organizations)} organisations`}`}
          trend={fleet}
        />
      </div>
    </div>
  );
}
