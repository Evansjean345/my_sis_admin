"use client";

import { cn } from "cn";
import { Gauge } from "lucide-react";

import { StatusBadge } from "@shared/components/status-badge";
import { FLEET_STATE_META, FLEET_STATE_SWATCH, fleetState, VEHICLE_ICONS } from "@shared/features/fleet/fleet-state";
import { formatNumber, formatRelative, toNumber } from "@shared/lib/format";
import type { VehicleDetail } from "@shared/types/vehicle";

/** Liste compacte des véhicules visibles sur la carte. */
export function FleetVehicleList({
  vehicles,
  selectedId,
  onSelect,
}: {
  vehicles: VehicleDetail[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
        Aucun véhicule pour ces filtres.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {vehicles.map((v) => {
        const state = fleetState(v);
        const meta = FLEET_STATE_META[state];
        const Icon = VEHICLE_ICONS[v.vehicleType] ?? VEHICLE_ICONS.other;
        const p = v.lastPosition;
        return (
          <li key={v.id}>
            <button
              type="button"
              aria-pressed={v.id === selectedId}
              onClick={() => onSelect(v.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                v.id === selectedId && "border-primary bg-muted/50",
              )}
            >
              <span
                className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", FLEET_STATE_SWATCH[state])}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-sm">{v.registration}</span>
                <span className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                  <Gauge className="size-3" />
                  {p
                    ? `${formatNumber(toNumber(p.speedKph), 0)} km/h · ${formatRelative(p.recordedAt)}`
                    : "aucune position"}
                </span>
              </span>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
