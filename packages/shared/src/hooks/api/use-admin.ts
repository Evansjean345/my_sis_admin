"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { adminService } from "@shared/services/admin.service";
import type { ActivityParams, AdminCommandListParams, AdminStatsParams } from "@shared/types/admin";

/**
 * Hooks du tableau de bord d'administration.
 *
 * - `retry: false` : un 403 signifie « pas super_admin », réessayer n'y
 *   changera rien.
 * - rafraîchissement toutes les 60 s : des compteurs, pas du temps réel.
 */
const STATS = { retry: false, refetchInterval: 60_000, placeholderData: keepPreviousData } as const;

export function useAdminOverview() {
  return useQuery({ queryKey: queryKeys.admin.overview, queryFn: () => adminService.overview(), ...STATS });
}

/** Indicateurs de l'organisation du jeton (niveaux 2 et 3). */
export function useOrganizationOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.organizationOverview,
    queryFn: () => adminService.organizationOverview(),
    enabled,
    ...STATS,
  });
}

/** Séries journalières des courbes : 5 min suffisent, la dernière journée évolue lentement. */
export function useAdminActivity(params: ActivityParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.activity(params),
    queryFn: () => adminService.activity(params),
    retry: false,
    refetchInterval: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Plateforme uniquement : `enabled = false` pour un compte d'organisation (403 assuré). */
export function useOrganizationsStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.organizationsStats,
    queryFn: () => adminService.organizationsStats(),
    enabled,
    ...STATS,
  });
}

export function useUsersStats(params: AdminStatsParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.usersStats(params),
    queryFn: () => adminService.usersStats(params),
    ...STATS,
  });
}

export function useVehiclesStats(params: AdminStatsParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.vehiclesStats(params),
    queryFn: () => adminService.vehiclesStats(params),
    ...STATS,
  });
}

export function useDevicesStats(params: AdminStatsParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.devicesStats(params),
    queryFn: () => adminService.devicesStats(params),
    ...STATS,
  });
}

export function useCommandsStats(params: AdminStatsParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.commandsStats(params),
    queryFn: () => adminService.commandsStats(params),
    ...STATS,
  });
}

/** Journal des commandes : rafraîchi plus souvent, une commande évolue en quelques secondes. */
export function useAdminCommands(params: AdminCommandListParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.commands(params),
    queryFn: () => adminService.commands(params),
    retry: false,
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  });
}
