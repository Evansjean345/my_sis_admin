import type { LucideIcon } from "lucide-react";
import { Bike, Bus, Car, Container, Forklift, Truck, Van } from "lucide-react";

import type { StatusTone } from "@shared/components/status-badge";
import { toNumber } from "@shared/lib/format";
import { MOVING_KPH } from "@shared/lib/track";
import type { VehicleDetail, VehicleType } from "@shared/types/vehicle";

/** État fin d'un véhicule. */
export type FleetState = "moving" | "alert" | "idle" | "stopped" | "offline" | "unknown";

/** Catégorie de la légende de la carte (regroupe les états). */
export type FleetCategory = "moving" | "alert" | "parked" | "offline";

/** Au-delà, la dernière position est considérée comme obsolète. */
export const STALE_MS = 60 * 60_000;

export const VEHICLE_ICONS: Record<VehicleType, LucideIcon> = {
  car: Car,
  van: Van,
  truck: Truck,
  tanker: Container,
  bus: Bus,
  motorcycle: Bike,
  trailer: Container,
  machinery: Forklift,
  other: Car,
};

export const FLEET_STATE_META: Record<FleetState, { label: string; tone: StatusTone }> = {
  moving: { label: "En déplacement", tone: "success" },
  alert: { label: "Survitesse", tone: "warning" },
  idle: { label: "Moteur tournant", tone: "danger" },
  stopped: { label: "À l'arrêt", tone: "danger" },
  offline: { label: "Hors ligne", tone: "neutral" },
  unknown: { label: "Sans position", tone: "neutral" },
};

export const CATEGORY_OF: Record<FleetState, FleetCategory> = {
  moving: "moving",
  alert: "alert",
  idle: "parked",
  stopped: "parked",
  offline: "offline",
  unknown: "offline",
};

export const FLEET_CATEGORIES: Array<{ value: FleetCategory; label: string; dot: string }> = [
  { value: "moving", label: "En déplacement", dot: "bg-emerald-500" },
  { value: "alert", label: "En alerte", dot: "bg-amber-500" },
  { value: "parked", label: "À l'arrêt", dot: "bg-red-500" },
  { value: "offline", label: "Hors ligne", dot: "bg-zinc-400" },
];

/** Pastille colorée du marqueur (fond + texte) par état. */
export const FLEET_STATE_SWATCH: Record<FleetState, string> = {
  moving: "bg-emerald-500 text-white",
  alert: "bg-amber-500 text-white",
  idle: "bg-red-500 text-white",
  stopped: "bg-red-500 text-white",
  offline: "bg-zinc-400 text-white dark:bg-zinc-600",
  unknown: "bg-zinc-300 text-zinc-700",
};

export function positionAge(vehicle: VehicleDetail, now = Date.now()): number | null {
  const p = vehicle.lastPosition;
  return p ? now - new Date(p.recordedAt).getTime() : null;
}

export function fleetState(vehicle: VehicleDetail, now = Date.now()): FleetState {
  const p = vehicle.lastPosition;
  if (!p) return "unknown";
  const age = positionAge(vehicle, now) ?? Number.POSITIVE_INFINITY;
  if (p.connectionState === "offline" || age > STALE_MS) return "offline";
  const speed = toNumber(p.speedKph) ?? 0;
  const limit = toNumber(vehicle.speedLimitKph);
  if (limit !== null && speed > limit) return "alert";
  if (speed > MOVING_KPH) return "moving";
  if (p.ignition) return "idle";
  return "stopped";
}

export function hasPosition(
  v: VehicleDetail,
): v is VehicleDetail & { lastPosition: NonNullable<VehicleDetail["lastPosition"]> } {
  return Boolean(
    v.lastPosition &&
      Number.isFinite(Number(v.lastPosition.latitude)) &&
      Number.isFinite(Number(v.lastPosition.longitude)),
  );
}

/* ------------------------------------------------------------------ alertes */

export type AlertSeverity = "critical" | "major" | "medium";

export interface FleetAlert {
  id: string;
  vehicleId: string;
  registration: string;
  severity: AlertSeverity;
  kind: "overspeed" | "signal_lost" | "no_position" | "idle" | "no_tracker";
  title: string;
  detail: string;
  /** Horodatage de référence (ms). */
  at: number | null;
}

export const SEVERITY_META: Record<AlertSeverity, { label: string; rank: number }> = {
  critical: { label: "Critique", rank: 0 },
  major: { label: "Majeur", rank: 1 },
  medium: { label: "Moyen", rank: 2 },
};

/**
 * Alertes dérivées de l'état courant de la flotte (l'API n'expose pas encore
 * de flux d'alertes) : survitesse, perte de signal, absence de position,
 * moteur tournant à l'arrêt, véhicule sans tracker.
 */
export function deriveAlerts(vehicles: VehicleDetail[], now = Date.now()): FleetAlert[] {
  const alerts: FleetAlert[] = [];
  for (const v of vehicles) {
    const p = v.lastPosition;
    const at = p ? new Date(p.recordedAt).getTime() : null;
    const base = { vehicleId: v.id, registration: v.registration, at };
    const state = fleetState(v, now);

    if (!v.device) {
      alerts.push({
        ...base,
        id: `${v.id}-no-tracker`,
        kind: "no_tracker",
        severity: "medium",
        title: "Aucun tracker monté",
        detail: "Le véhicule n'est pas suivi.",
      });
      continue;
    }
    if (state === "alert" && p) {
      alerts.push({
        ...base,
        id: `${v.id}-overspeed`,
        kind: "overspeed",
        severity: "critical",
        title: "Dépassement de vitesse",
        detail: `${Math.round(toNumber(p.speedKph) ?? 0)} km/h (limite ${Math.round(toNumber(v.speedLimitKph) ?? 0)} km/h)`,
      });
    } else if (state === "offline" && p) {
      const hours = Math.floor((positionAge(v, now) ?? 0) / 3_600_000);
      alerts.push({
        ...base,
        id: `${v.id}-signal`,
        kind: "signal_lost",
        severity: "major",
        title: "Perte de signal",
        detail: hours >= 1 ? `Aucune trame depuis ${hours} h` : "Tracker déconnecté",
      });
    } else if (state === "unknown") {
      alerts.push({
        ...base,
        id: `${v.id}-no-position`,
        kind: "no_position",
        severity: "major",
        title: "Aucune position reçue",
        detail: "Vérifier la SIM, l'APN et la programmation serveur.",
      });
    } else if (state === "idle") {
      alerts.push({
        ...base,
        id: `${v.id}-idle`,
        kind: "idle",
        severity: "medium",
        title: "Moteur tournant à l'arrêt",
        detail: "Contact allumé, véhicule immobile.",
      });
    }
  }
  return alerts.sort(
    (a, b) => SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank || (b.at ?? 0) - (a.at ?? 0),
  );
}
