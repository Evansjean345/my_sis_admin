"use client";

import { useMemo } from "react";

import { type LivePosition, useRealtimeStore } from "@shared/stores/realtime/realtime-store";
import type { VehicleDetail } from "@shared/types/vehicle";

/**
 * Superpose la dernière position reçue en temps réel à celle de l'API.
 * La plus récente gagne : une liste rafraîchie après l'évènement reprend la main.
 */
export function withLivePosition(vehicle: VehicleDetail, live: LivePosition | undefined): VehicleDetail {
  if (!live) return vehicle;
  const known = vehicle.lastPosition?.recordedAt;
  if (known && Date.parse(known) >= Date.parse(live.recordedAt)) return vehicle;
  return {
    ...vehicle,
    lastPosition: {
      latitude: live.latitude,
      longitude: live.longitude,
      speedKph: live.speedKph,
      ignition: live.ignition,
      recordedAt: live.recordedAt,
      // Une trame vient d'arriver : le boîtier émet.
      connectionState: "online",
    },
  };
}

/** Véhicules avec leurs positions temps réel. Référence stable tant que rien ne change. */
export function useLiveVehicles(vehicles: VehicleDetail[]): VehicleDetail[] {
  const positions = useRealtimeStore((s) => s.positions);
  return useMemo(() => vehicles.map((v) => withLivePosition(v, positions[v.id])), [vehicles, positions]);
}

/** Un véhicule avec sa position temps réel. */
export function useLiveVehicle(vehicle: VehicleDetail | undefined): VehicleDetail | undefined {
  const live = useRealtimeStore((s) => (vehicle ? s.positions[vehicle.id] : undefined));
  return useMemo(() => (vehicle ? withLivePosition(vehicle, live) : undefined), [vehicle, live]);
}

/** Le flux est-il ouvert ? (les écrans espacent alors leur rafraîchissement de secours) */
export function useRealtimeConnected(): boolean {
  return useRealtimeStore((s) => s.status === "connected" && s.channels > 0);
}
