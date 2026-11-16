"use client";

import { type ReactNode, useEffect, useMemo } from "react";

import { useAccess } from "@shared/components/providers/access-provider";
import { useOrganizationsStats } from "@shared/hooks/api/use-admin";
import {
  type DeviceStatusEvent,
  devicesChannel,
  getTransmit,
  type PositionEvent,
  positionsChannel,
} from "@shared/lib/realtime/transmit";
import { useRealtimeStore } from "@shared/stores/realtime/realtime-store";

/** Au-delà, on ne suit pas toutes les organisations à la fois (niveau 1). */
const MAX_PLATFORM_CHANNELS = 50;
/** Les évènements sont regroupés : un rendu par seconde au plus, quel que soit le débit. */
const FLUSH_MS = 1_000;

/**
 * Ouvre le flux temps réel du compte connecté et s'abonne à ses canaux.
 *
 *  - niveaux 2 et 3 : l'organisation du compte, et elle seule ;
 *  - niveau 1 : chaque organisation de la plateforme (le joker `*` y est
 *    autorisé par l'API), dans la limite de `MAX_PLATFORM_CHANNELS`.
 *
 * Monté une fois dans le layout du tableau de bord : changer d'écran ne
 * referme pas le flux.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const access = useAccess();
  const organizations = useOrganizationsStats(access.isPlatform);

  const organizationIds = useMemo(() => {
    if (!access.isPlatform) return access.organizationId ? [access.organizationId] : [];
    return (organizations.data ?? [])
      .filter((o) => o.isActive)
      .slice(0, MAX_PLATFORM_CHANNELS)
      .map((o) => o.id);
  }, [access.isPlatform, access.organizationId, organizations.data]);

  // Clé stable : un nouveau tableau de mêmes identifiants ne rouvre rien.
  const key = organizationIds.join(",");

  useEffect(() => {
    const transmit = getTransmit();
    const ids = key ? key.split(",") : [];
    if (!transmit || ids.length === 0) return;

    const store = useRealtimeStore.getState();
    const onStatus = (status: Parameters<typeof store.setStatus>[0]) => () => store.setStatus(status);
    const handlers = {
      initializing: onStatus("connecting"),
      connected: onStatus("connected"),
      reconnecting: onStatus("reconnecting"),
      disconnected: onStatus("disconnected"),
    } as const;
    for (const [event, handler] of Object.entries(handlers)) {
      transmit.on(event as keyof typeof handlers, handler);
    }
    store.setStatus("connecting");

    // ---- tampon : regroupe les évènements entre deux rendus
    let positions: PositionEvent[] = [];
    let devices: DeviceStatusEvent[] = [];
    const timer = window.setInterval(() => {
      if (positions.length === 0 && devices.length === 0) return;
      useRealtimeStore.getState().applyBatch(positions, devices);
      positions = [];
      devices = [];
    }, FLUSH_MS);

    let accepted = 0;
    const subscriptions = ids.flatMap((id) => [
      { sub: transmit.subscription(positionsChannel(id)), kind: "positions" as const },
      { sub: transmit.subscription(devicesChannel(id)), kind: "devices" as const },
    ]);
    const unlisten = subscriptions.map(({ sub, kind }) =>
      kind === "positions"
        ? sub.onMessage<PositionEvent>((m) => positions.push(m))
        : sub.onMessage<DeviceStatusEvent>((m) => devices.push(m)),
    );
    for (const { sub } of subscriptions) {
      sub
        .create()
        .then(() => {
          accepted += 1;
          useRealtimeStore.getState().setChannels(accepted);
        })
        .catch(() => undefined); // 401/403 : canal refusé, le reste continue
    }

    return () => {
      window.clearInterval(timer);
      for (const off of unlisten) off();
      for (const { sub } of subscriptions) void sub.delete().catch(() => undefined);
      for (const [event, handler] of Object.entries(handlers)) {
        transmit.off(event as keyof typeof handlers, handler);
      }
      useRealtimeStore.getState().setChannels(0);
    };
  }, [key]);

  return <>{children}</>;
}
