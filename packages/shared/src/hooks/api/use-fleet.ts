"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";

import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { queryKeys } from "@shared/hooks/api/query-keys";
import { useRealtimeConnected } from "@shared/hooks/use-live-vehicles";
import { isPlatformScope } from "@shared/lib/axios";
import { deviceService } from "@shared/services/device.service";
import { vehicleService } from "@shared/services/vehicle.service";
import type { TrackRange } from "@shared/types/track";
import type { VehicleDetail } from "@shared/types/vehicle";

/** Nombre de véhicules suivis simultanément sur la carte (une requête détail par véhicule). */
export const FLEET_MAX_VEHICLES = 100;

/**
 * Flotte sur la carte, selon le périmètre du compte :
 *
 *  - organisation (niveaux 2 et 3) : `GET /fleet/live`, toute la flotte en un
 *    appel ;
 *  - plateforme (niveau 1) : liste `/admin/vehicles` + détail de chaque
 *    véhicule (boîtier monté et dernière position).
 *
 * Les positions arrivent ensuite en temps réel (SSE, cf. `RealtimeProvider`)
 * et sont superposées par `useLiveVehicles`. Le rafraîchissement HTTP n'est
 * plus qu'un filet de sécurité : espacé quand le flux est ouvert.
 */
export function useFleet(enabled = true, params: { vehicleGroupId?: string } = {}) {
  // Niveau du contexte (identique au rendu serveur), à défaut celui du cookie.
  const platform = useOptionalAccess()?.isPlatform ?? isPlatformScope();
  const realtime = useRealtimeConnected();

  const live = useQuery({
    queryKey: queryKeys.fleet.live(params),
    queryFn: () => vehicleService.live(params),
    refetchInterval: realtime ? 2 * 60_000 : 30_000,
    placeholderData: keepPreviousData,
    enabled: enabled && !platform,
  });

  const platformFleet = usePlatformFleet(enabled && platform, realtime);

  if (!platform) {
    return {
      vehicles: live.data?.data ?? EMPTY,
      total: live.data?.meta.total ?? 0,
      isPending: live.isPending && enabled,
      isError: live.isError,
      error: live.error,
      isFetching: live.isFetching,
      refetch: () => void live.refetch(),
    };
  }
  return platformFleet;
}

const EMPTY: VehicleDetail[] = [];

function usePlatformFleet(enabled: boolean, realtime: boolean) {
  const list = useQuery({
    queryKey: queryKeys.vehicles.list({ perPage: FLEET_MAX_VEHICLES, status: "active" }),
    queryFn: () => vehicleService.list({ perPage: FLEET_MAX_VEHICLES, status: "active" }),
    refetchInterval: 5 * 60_000,
    enabled,
  });

  const details = useQueries({
    queries: (list.data?.data ?? []).map((v) => ({
      queryKey: queryKeys.vehicles.detail(v.id),
      queryFn: () => vehicleService.get(v.id),
      refetchInterval: realtime ? 2 * 60_000 : 30_000,
      placeholderData: keepPreviousData,
    })),
    // `combine` est mémoïsé par React Query : référence stable tant que les données ne changent pas.
    combine: (results) => ({
      vehicles: results.map((r) => r.data).filter((d): d is VehicleDetail => Boolean(d)),
      pending: results.length > 0 && results.every((r) => r.isPending),
      fetching: results.some((r) => r.isFetching),
      refetchAll: () => {
        for (const r of results) void r.refetch();
      },
    }),
  });

  return {
    vehicles: details.vehicles,
    total: list.data?.meta.total ?? 0,
    isPending: list.isPending || details.pending,
    isError: list.isError,
    error: list.error,
    isFetching: list.isFetching || details.fetching,
    refetch: () => {
      void list.refetch();
      details.refetchAll();
    },
  };
}

/** Trajet d'un boîtier sur une période (historique flespi). */
export function useTrack(deviceId: string | null | undefined, range: TrackRange, onlyValidFix = false) {
  const live = range.to.getTime() > Date.now() - 60_000;
  return useQuery({
    queryKey: ["track", deviceId ?? "", range.from.toISOString(), range.to.toISOString(), onlyValidFix] as const,
    queryFn: () => deviceService.track(deviceId as string, range, { onlyValidFix }),
    enabled: Boolean(deviceId),
    placeholderData: keepPreviousData,
    staleTime: live ? 30_000 : 10 * 60_000,
    retry: false,
  });
}
