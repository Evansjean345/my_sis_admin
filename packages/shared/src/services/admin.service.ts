import { adminPath, api, scopedPath } from "@shared/lib/axios";
import type {
  ActivityParams,
  ActivityReport,
  AdminCommand,
  AdminCommandListParams,
  AdminOverview,
  AdminStatsParams,
  CommandStats,
  DeviceStats,
  OrganizationOverview,
  OrganizationStatsRow,
  UserStats,
  VehicleStats,
} from "@shared/types/admin";
import type { ApiResponse, Paginated } from "@shared/types/api";

/**
 * Statistiques et journaux des tableaux de bord.
 *
 * Les statistiques ont la MÊME forme sur les deux périmètres : `/admin/*`
 * pour la plateforme (niveau 1, filtre `?organizationId=` possible), et la
 * route sans préfixe pour une organisation (niveaux 2 et 3, organisation du
 * jeton). `scopedPath` choisit selon le compte connecté.
 *
 * Deux exceptions, de forme différente : `overview()` (plateforme) et
 * `organizationOverview()` (organisation), et `organizationsStats()`, qui
 * n'existe qu'au niveau plateforme.
 */

async function getData<T>(path: string, params?: object): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(scopedPath(path), { params });
  return data.data;
}

async function getPlatformData<T>(path: string, params?: object): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(adminPath(path), { params });
  return data.data;
}

export const adminService = {
  /** GET /admin/overview — indicateurs de la page d'accueil, en un appel. */
  overview(): Promise<AdminOverview> {
    return getPlatformData<AdminOverview>("/overview");
  },

  /**
   * GET /overview — indicateurs de l'organisation du jeton (niveaux 2 et 3) :
   * comptes, véhicules, flottes, trackers et commandes, en un appel.
   */
  organizationOverview(): Promise<OrganizationOverview> {
    return getData<OrganizationOverview>("/overview");
  },

  /** GET /admin/stats/activity?days=&organizationId= — séries journalières des courbes. */
  activity(params: ActivityParams = {}): Promise<ActivityReport> {
    return getData<ActivityReport>("/stats/activity", params);
  },

  /** GET /admin/organizations/stats — comptes, véhicules, boîtiers par client. */
  organizationsStats(): Promise<OrganizationStatsRow[]> {
    return getPlatformData<OrganizationStatsRow[]>("/organizations/stats");
  },

  /** GET /admin/users/stats?organizationId= */
  usersStats(params: AdminStatsParams = {}): Promise<UserStats> {
    return getData<UserStats>("/users/stats", params);
  },

  /** GET /admin/vehicles/stats?organizationId= */
  vehiclesStats(params: AdminStatsParams = {}): Promise<VehicleStats> {
    return getData<VehicleStats>("/vehicles/stats", params);
  },

  /** GET /admin/devices/stats?organizationId= */
  devicesStats(params: AdminStatsParams = {}): Promise<DeviceStats> {
    return getData<DeviceStats>("/devices/stats", params);
  },

  /** GET /admin/commands/stats?organizationId= — 24 dernières heures + commandes en vol. */
  commandsStats(params: AdminStatsParams = {}): Promise<CommandStats> {
    return getData<CommandStats>("/commands/stats", params);
  },

  /** GET /admin/commands — journal de toutes les commandes, du plus récent au plus ancien. */
  async commands(params: AdminCommandListParams = {}): Promise<Paginated<AdminCommand>> {
    const { data } = await api.get<Paginated<AdminCommand>>(scopedPath("/commands"), { params });
    return data;
  },
};
