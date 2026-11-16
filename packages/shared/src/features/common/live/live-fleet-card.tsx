"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { cn } from "cn";
import { Maximize2, Radio } from "lucide-react";

import { StatusBadge } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import { Skeleton } from "@shared/components/ui/skeleton";
import { FleetMap } from "@shared/features/fleet/fleet-map";
import {
  CATEGORY_OF,
  FLEET_CATEGORIES,
  FLEET_STATE_META,
  type FleetCategory,
  fleetState,
} from "@shared/features/fleet/fleet-state";
import { formatNumber, formatRelative, toNumber } from "@shared/lib/format";
import { useRealtimeStore } from "@shared/stores/realtime/realtime-store";
import type { VehicleDetail } from "@shared/types/vehicle";

/** Combien de dernières trames afficher dans le fil. */
const FEED_SIZE = 8;

/**
 * Carte de la flotte en direct + fil des dernières positions reçues (SSE).
 *
 * Partagée par les accueils niveau 2 et niveau 3 : la carte complète
 * (trajets, rejeu, filtres) reste sur `/dashboard/fleet`.
 */
export function LiveFleetCard({
  vehicles,
  loading,
  title = "Flotte en direct",
  className,
}: {
  /** Véhicules déjà fusionnés avec le temps réel (`useLiveVehicles`). */
  vehicles: VehicleDetail[];
  loading: boolean;
  title?: string;
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<FleetCategory>>(() => new Set());

  const counts = useMemo(() => {
    const c: Record<FleetCategory, number> = { moving: 0, alert: 0, parked: 0, offline: 0 };
    for (const v of vehicles) c[CATEGORY_OF[fleetState(v)]] += 1;
    return c;
  }, [vehicles]);

  const shown = useMemo(
    () => vehicles.filter((v) => v.id === selectedId || !hidden.has(CATEGORY_OF[fleetState(v)])),
    [vehicles, hidden, selectedId],
  );

  const toggle = (category: FleetCategory) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });

  return (
    <Card className={cn("gap-3 overflow-hidden pb-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="size-4 text-emerald-600" aria-hidden="true" />
          {title}
        </CardTitle>
        <CardDescription>Positions poussées par le serveur dès leur réception</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" asChild>
            <Link href={selectedId ? `/dashboard/fleet?vehicle=${selectedId}` : "/dashboard/fleet"} prefetch={false}>
              <Maximize2 data-icon="inline-start" />
              Carte complète
            </Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0">
        {/* Légende cliquable : masque / affiche une catégorie sur la carte. */}
        <div className="flex flex-wrap gap-2 px-6">
          {FLEET_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => toggle(c.value)}
              aria-pressed={!hidden.has(c.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-opacity",
                hidden.has(c.value) && "opacity-40",
              )}
            >
              <span className={cn("size-2 rounded-full", c.dot)} />
              {c.label}
              <span className="font-semibold tabular-nums">{formatNumber(counts[c.value])}</span>
            </button>
          ))}
        </div>

        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-[380px] border-t lg:border-r">
            {loading ? (
              <Skeleton className="size-full rounded-none" />
            ) : (
              <FleetMap vehicles={shown} selectedId={selectedId} onSelect={setSelectedId} className="size-full" />
            )}
          </div>
          <LiveFeed vehicles={vehicles} onSelect={setSelectedId} selectedId={selectedId} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Dernières positions reçues en temps réel, de la plus récente à la plus ancienne. */
function LiveFeed({
  vehicles,
  selectedId,
  onSelect,
}: {
  vehicles: VehicleDetail[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const positions = useRealtimeStore((s) => s.positions);
  const byId = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  const feed = useMemo(
    () =>
      Object.values(positions)
        .filter((p) => p.vehicleId && byId.has(p.vehicleId))
        .sort((a, b) => b.receivedAt - a.receivedAt)
        .slice(0, FEED_SIZE),
    [positions, byId],
  );

  return (
    <div className="flex min-h-0 flex-col border-t">
      <div className="px-4 py-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Dernières trames
      </div>
      <ScrollArea className="h-[340px]">
        {feed.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted-foreground text-sm">
            En attente de la prochaine position… Les véhicules apparaissent ici dès qu'ils émettent.
          </p>
        ) : (
          <ul className="flex flex-col">
            {feed.map((p) => {
              const vehicle = byId.get(p.vehicleId as string) as VehicleDetail;
              const state = fleetState(vehicle);
              const meta = FLEET_STATE_META[state];
              return (
                <li key={p.vehicleId}>
                  <button
                    type="button"
                    onClick={() => onSelect(vehicle.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/60",
                      selectedId === vehicle.id && "bg-muted",
                    )}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-sm">{vehicle.registration}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatNumber(Math.round(toNumber(p.speedKph) ?? 0))} km/h · {formatRelative(p.recordedAt)}
                      </span>
                    </span>
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
