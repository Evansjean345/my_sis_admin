"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { DeviceStats, VehicleStats } from "@/types/admin";

/**
 * Jauge de mise en service. La piste vide est un cran plus clair de la même
 * teinte que le remplissage : la proportion se lit sur toute la barre. En
 * dessous de 80 %, le remplissage passe en couleur d'attention — l'étape est
 * alors la cause probable de véhicules muets.
 */
function Meter({ label, value, total, hint }: { label: string; value: number; total: number; hint: string }) {
  const share = total > 0 ? Math.round((value / total) * 100) : 0;
  const low = total > 0 && share < 80;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums">
          <span className="font-semibold">{share} %</span>
          <span className="text-muted-foreground">
            {" "}
            · {formatNumber(value)} / {formatNumber(total)}
          </span>
        </span>
      </div>
      {/* Décoratif : la valeur exacte est écrite juste au-dessus. */}
      <div
        aria-hidden="true"
        className={`h-2 w-full overflow-hidden rounded-full ${low ? "bg-amber-500/15" : "bg-sky-600/15"}`}
      >
        <div
          className={`h-full rounded-full transition-[width] ${low ? "bg-amber-500" : "bg-sky-600 dark:bg-sky-500"}`}
          style={{ width: `${share}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}

/** Les quatre étapes qui séparent un boîtier en carton d'une position sur la carte. */
export function DeploymentCard({
  devices,
  vehicles,
  loading,
}: {
  devices: DeviceStats | undefined;
  vehicles: VehicleStats | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des boitiers mis en service</CardTitle>
        <CardDescription>Du boîtier enregistré à la position reçue</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {loading || !devices || !vehicles ? (
          Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
            <Skeleton key={i} className="h-12 w-full" />
          ))
        ) : (
          <>
            <Meter
              label="Rattachés à flespi"
              value={devices.flespi.linked}
              total={devices.total}
              hint={`${formatNumber(devices.flespi.notLinked)} boîtiers ne recevront aucune trame`}
            />
            <Meter
              label="Montés sur un véhicule"
              value={devices.assignment.assigned}
              total={devices.total}
              hint={`${formatNumber(devices.assignment.unassigned)} en stock`}
            />
            <Meter
              label="Ont émis dans les 24 h"
              value={Math.max(devices.total - devices.silentSince24h, 0)}
              total={devices.total}
              hint={`${formatNumber(devices.silentSince24h)} silencieux : couverture, SIM ou alimentation`}
            />
            <Meter
              label="Véhicules équipés"
              value={vehicles.withDevice}
              total={vehicles.total}
              hint={`${formatNumber(vehicles.withoutDevice)} véhicules sans boîtier`}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
