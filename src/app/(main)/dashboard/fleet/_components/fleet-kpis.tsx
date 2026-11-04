import { Car, CircleDashed, Gauge, Navigation, WifiOff } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, toNumber } from "@/lib/format";
import type { VehicleDetail } from "@/types/vehicle";

import { CATEGORY_OF, fleetState } from "./fleet-state";

function Hint({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${dot}`} />
      {children}
    </span>
  );
}

export function FleetKpis({
  vehicles,
  total,
  loading,
}: {
  vehicles: VehicleDetail[];
  total: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const states = vehicles.map((v) => fleetState(v));
  const count = (pred: (s: (typeof states)[number]) => boolean) =>
    states.filter(pred).length;
  const inService = count((s) => CATEGORY_OF[s] !== "offline");
  const moving = count((s) => s === "moving" || s === "alert");
  const overspeed = count((s) => s === "alert");
  const idle = count((s) => s === "idle");
  const stopped = count((s) => s === "stopped");
  const offline = count((s) => s === "offline");
  const noPosition = count((s) => s === "unknown");
  const movingSpeeds = vehicles
    .filter((_, i) => states[i] === "moving" || states[i] === "alert")
    .map((v) => toNumber(v.lastPosition?.speedKph) ?? 0);
  const avgSpeed = movingSpeeds.length
    ? movingSpeeds.reduce((a, b) => a + b, 0) / movingSpeeds.length
    : null;
  const operational = total > 0 ? Math.round((inService / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 dark:*:data-[slot=card]:bg-card">
      <div className="rounded-lg shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
        <MetricCard
          icon={Car}
          label="Véhicules en service"
          value={`${inService} / ${total}`}
          hint={<Hint dot="bg-emerald-500">{operational} % opérationnels</Hint>}
        />
      </div>
      <div className="rounded-lg shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
        <MetricCard
          icon={Navigation}
          label="Véhicules en déplacement"
          value={moving}
          hint={
            overspeed > 0 ? (
              <Hint dot="bg-amber-500">{overspeed} en survitesse</Hint>
            ) : (
              <Hint dot="bg-emerald-500">Temps réel</Hint>
            )
          }
        />
      </div>
      <div className="rounded-lg shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
        <MetricCard
          icon={CircleDashed}
          label="Véhicules à l'arrêt"
          value={idle + stopped}
          hint={
            <Hint dot="bg-red-500">
              Moteur tournant {idle} · Coupé {stopped}
            </Hint>
          }
        />
      </div>
      <div className="rounded-lg shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
        <MetricCard
          icon={Gauge}
          label="Vitesse moyenne flotte"
          value={
            avgSpeed === null ? "— km/h" : `${formatNumber(avgSpeed, 0)} km/h`
          }
          hint="Véhicules en déplacement"
        />
      </div>
      <div className="rounded-lg shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
        <MetricCard
          icon={WifiOff}
          label="Hors ligne"
          value={offline + noPosition}
          hint={
            <Hint dot="bg-zinc-400">
              Signal perdu {offline} · Sans position {noPosition}
            </Hint>
          }
        />
      </div>
    </div>
  );
}
