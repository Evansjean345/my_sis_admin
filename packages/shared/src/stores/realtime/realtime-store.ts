import { create } from "zustand";

import type { DeviceStatusEvent, PositionEvent } from "@shared/lib/realtime/transmit";

/**
 * État temps réel reçu par SSE, partagé par tous les écrans.
 *
 * Volontairement HORS du cache React Query : les listes (`/fleet/live`,
 * `/admin/vehicles`, détails) gardent leur forme et leur rafraîchissement ;
 * les écrans superposent ces dernières valeurs au moment du rendu
 * (cf. `useLiveVehicles`). Une trame différée (Store & Forward) plus ancienne
 * que la valeur connue n'écrase jamais une position plus récente.
 */
export type RealtimeStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export interface LivePosition extends PositionEvent {
  /** Réception navigateur (ms). */
  receivedAt: number;
}

export interface LiveDeviceStatus extends DeviceStatusEvent {
  receivedAt: number;
}

interface RealtimeState {
  status: RealtimeStatus;
  /** Canaux dont l'abonnement a été accepté par l'API. */
  channels: number;
  /** Par véhicule. */
  positions: Record<string, LivePosition>;
  /** Par boîtier. */
  devices: Record<string, LiveDeviceStatus>;
  lastEventAt: number | null;
  /** Nombre d'évènements reçus depuis l'ouverture (indicateur de l'en-tête). */
  received: number;

  setStatus: (status: RealtimeStatus) => void;
  setChannels: (channels: number) => void;
  /** Applique un lot d'évènements en UNE mise à jour (un rendu par seconde au plus). */
  applyBatch: (positions: PositionEvent[], devices: DeviceStatusEvent[]) => void;
  reset: () => void;
}

const newer = (a: string, b: string | undefined) => !b || Date.parse(a) >= Date.parse(b);

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  status: "idle",
  channels: 0,
  positions: {},
  devices: {},
  lastEventAt: null,
  received: 0,

  setStatus: (status) => set({ status }),
  setChannels: (channels) => set({ channels }),

  applyBatch: (positionEvents, deviceEvents) =>
    set((state) => {
      if (positionEvents.length === 0 && deviceEvents.length === 0) return state;
      const now = Date.now();
      const positions = { ...state.positions };
      for (const p of positionEvents) {
        if (!p.vehicleId) continue; // boîtier en stock : rien à placer sur la carte
        if (newer(p.recordedAt, positions[p.vehicleId]?.recordedAt)) {
          positions[p.vehicleId] = { ...p, receivedAt: now };
        }
      }
      const devices = { ...state.devices };
      for (const d of deviceEvents) {
        if (newer(d.lastSeenAt, devices[d.deviceId]?.lastSeenAt)) {
          devices[d.deviceId] = { ...d, receivedAt: now };
        }
      }
      return {
        positions,
        devices,
        lastEventAt: now,
        received: state.received + positionEvents.length + deviceEvents.length,
      };
    }),

  reset: () => set({ status: "idle", channels: 0, positions: {}, devices: {}, lastEventAt: null, received: 0 }),
}));
