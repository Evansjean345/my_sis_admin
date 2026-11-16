"use client";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import { CircleCheck, CpuIcon, Gauge, KeyRound, MapPinOff, SatelliteDish } from "lucide-react";

import { type AlertSeverity, type FleetAlert, SEVERITY_META } from "@shared/features/fleet/fleet-state";
import { formatRelative } from "@shared/lib/format";

const KIND_ICON: Record<FleetAlert["kind"], LucideIcon> = {
  overspeed: Gauge,
  signal_lost: SatelliteDish,
  no_position: MapPinOff,
  idle: KeyRound,
  no_tracker: CpuIcon,
};

const SEVERITY_STYLE: Record<AlertSeverity, { card: string; badge: string }> = {
  critical: {
    card: "border-destructive/30 bg-destructive/10 hover:bg-destructive/15",
    badge: "bg-destructive text-white",
  },
  major: {
    card: "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15",
    badge: "bg-amber-500 text-white",
  },
  medium: {
    card: "border-border bg-muted/40 hover:bg-muted/70",
    badge: "bg-muted-foreground text-background",
  },
};

export function FleetAlerts({ alerts, onSelect }: { alerts: FleetAlert[]; onSelect: (vehicleId: string) => void }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center">
        <CircleCheck className="size-6 text-emerald-600" />
        <p className="font-medium text-sm">Aucune alerte</p>
        <p className="text-muted-foreground text-xs">Toute la flotte est dans un état nominal.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {alerts.map((alert) => {
        const Icon = KIND_ICON[alert.kind];
        const style = SEVERITY_STYLE[alert.severity];
        return (
          <li key={alert.id}>
            <button
              type="button"
              onClick={() => onSelect(alert.vehicleId)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                style.card,
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background/60">
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wide",
                      style.badge,
                    )}
                  >
                    {SEVERITY_META[alert.severity].label}
                  </span>
                  <span className="truncate font-mono text-muted-foreground text-xs">{alert.registration}</span>
                  <span className="ml-auto shrink-0 text-muted-foreground text-xs tabular-nums">
                    {alert.at ? formatRelative(alert.at) : ""}
                  </span>
                </span>
                <span className="font-medium text-sm leading-tight">{alert.title}</span>
                <span className="truncate text-muted-foreground text-xs">{alert.detail}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
