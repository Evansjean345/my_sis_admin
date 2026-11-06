"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import { groupServiceOf } from "@/hooks/api/use-groups";
import { scheduleService } from "@/services/schedule.service";
import { vehicleService } from "@/services/vehicle.service";
import type { GroupDetail } from "@/types/group";
import type { UsageSchedule, UsageScheduleDetail } from "@/types/schedule";

import { queryKeys } from "./query-keys";

/** Plafond de l'API (`perPage ≤ 100`) : au-delà, l'analyse porte sur les 100 premiers calendriers. */
export const ANALYTICS_SCHEDULE_LIMIT = 100;

export interface ScheduleAnalyticsData {
  /** Calendriers ACTIFS (seuls appliqués par le moteur). */
  schedules: UsageSchedule[];
  details: UsageScheduleDetail[];
  /** Flottes rattachées à au moins un calendrier actif, avec leurs véhicules. */
  groups: Map<string, GroupDetail>;
  activeTotal: number;
  inactiveTotal: number;
  /** Parc total dans le périmètre (pour le taux de couverture). */
  vehiclesTotal: number | null;
  truncated: boolean;
}

/**
 * Données du prévisionnel : rien de nouveau côté API, on assemble des
 * lectures existantes et leurs clés de cache — une modification de
 * calendrier ou de flotte invalide donc aussi l'analyse.
 *
 *   1. calendriers actifs (liste)          → plages, fuseau
 *   2. détail de chacun                    → véhicules et flottes rattachés
 *   3. détail de chaque flotte rattachée   → véhicules membres
 */
export function useScheduleAnalyticsData(organizationId: string | undefined) {
  const active = useQuery({
    queryKey: queryKeys.schedules.list({ organizationId, isActive: true, perPage: ANALYTICS_SCHEDULE_LIMIT, page: 1 }),
    queryFn: () => scheduleService.list({ organizationId, isActive: true, perPage: ANALYTICS_SCHEDULE_LIMIT, page: 1 }),
  });
  const inactive = useQuery({
    queryKey: queryKeys.schedules.list({ organizationId, isActive: false, perPage: 1, page: 1 }),
    queryFn: () => scheduleService.list({ organizationId, isActive: false, perPage: 1, page: 1 }),
  });
  const fleet = useQuery({
    queryKey: queryKeys.vehicles.list({ organizationId, perPage: 1, page: 1 }),
    queryFn: () => vehicleService.list({ organizationId, perPage: 1, page: 1 }),
    retry: false,
  });

  const schedules = active.data?.data ?? [];
  const details = useQueries({
    queries: schedules.map((s) => ({
      queryKey: queryKeys.schedules.detail(s.id),
      queryFn: () => scheduleService.get(s.id),
      retry: false,
    })),
  });

  const groupIds = [...new Set(details.flatMap((q) => (q.data ? q.data.vehicleGroups.map((g) => g.id) : [])))].sort();
  const groups = useQueries({
    queries: groupIds.map((id) => ({
      queryKey: queryKeys.groups.detail("vehicle_group", id),
      queryFn: () => groupServiceOf("vehicle_group").get(id),
      retry: false,
    })),
  });

  const all = [active, inactive, ...details, ...groups];
  const isPending = active.isPending || details.some((q) => q.isPending) || groups.some((q) => q.isPending);
  const failed = all.find((q) => q.isError);

  const data: ScheduleAnalyticsData | undefined = isPending
    ? undefined
    : {
        schedules,
        details: details.flatMap((q) => (q.data ? [q.data] : [])),
        groups: new Map(groups.flatMap((q) => (q.data ? [[q.data.id, q.data] as const] : []))),
        activeTotal: active.data?.meta.total ?? 0,
        inactiveTotal: inactive.data?.meta.total ?? 0,
        vehiclesTotal: fleet.data?.meta.total ?? null,
        truncated: (active.data?.meta.total ?? 0) > schedules.length,
      };

  return {
    data,
    isPending,
    isError: Boolean(failed),
    error: failed?.error ?? null,
    isFetching: all.some((q) => q.isFetching) || fleet.isFetching,
    refetch: () => {
      for (const q of [...all, fleet]) void q.refetch();
    },
  };
}
