import type { PaginationParams } from "@shared/types/api";
import type { CommandStatus } from "@shared/types/command";
import type { DeviceStatus } from "@shared/types/device";
import type { UserStatus } from "@shared/types/user";
import type { VehicleStatus } from "@shared/types/vehicle";

/**
 * Tableau de bord d'administration — routes `/api/v1/admin/*`.
 *
 * Périmètre PLATEFORME : toutes les organisations. Réservé au joker `*`
 * (super_admin) ; un administrateur client reçoit 403.
 */

/** Résumé d'organisation ajouté à chaque ligne des listes admin. */
export interface OrganizationSummary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/** Filtre commun des statistiques : absent = toutes les organisations. */
export interface AdminStatsParams {
  organizationId?: string;
}

/** Compteurs `{ valeur: total }` renvoyés par les endpoints de stats. */
export type Counts<K extends string = string> = Partial<Record<K, number>>;

export interface ByOrganization {
  organization: OrganizationSummary | { id: string };
  total: number;
}

/** GET /admin/overview */
export interface AdminOverview {
  organizations: { total: number; active: number };
  users: { total: number; active: number };
  vehicles: { total: number };
  devices: { total: number; flespiLinked: number; silentSince24h: number };
  commands: { last24h: number; failedLast24h: number; inFlight: number };
  generatedAt: string;
}

/** GET /overview — l'organisation du jeton (tableaux de bord niveaux 2 et 3). */
export interface OrganizationOverview {
  organization: OrganizationSummary | null;
  users: { total: number; active: number };
  vehicles: { total: number; active: number; withDevice: number };
  /** Flottes (groupes de véhicules) et lots (groupes de trackers). */
  groups: { vehicles: number; devices: number };
  devices: { total: number; assigned: number; silentSince24h: number };
  commands: { last24h: number; failedLast24h: number; inFlight: number };
  generatedAt: string;
}

/** GET /admin/organizations/stats — une ligne par organisation. */
export interface OrganizationStatsRow extends OrganizationSummary {
  users: number;
  vehicles: number;
  devices: number;
}

/** GET /admin/users/stats */
export interface UserStats {
  total: number;
  byStatus: Counts<UserStatus>;
  byOrganization: ByOrganization[];
}

/** État de connexion issu de `vehicle_last_positions`. */
export type VehicleConnection = "online" | "idle" | "offline" | "never_seen";

/** GET /admin/vehicles/stats */
export interface VehicleStats {
  total: number;
  withDevice: number;
  withoutDevice: number;
  byStatus: Counts<VehicleStatus>;
  byConnection: Counts<VehicleConnection>;
  byOrganization: ByOrganization[];
}

/** GET /admin/devices/stats */
export interface DeviceStats {
  total: number;
  byStatus: Counts<DeviceStatus>;
  flespi: { linked: number; notLinked: number };
  assignment: { assigned: number; unassigned: number };
  silentSince24h: number;
  byOrganization: ByOrganization[];
}

/** GET /admin/commands/stats */
export interface CommandStats {
  last24h: {
    total: number;
    byStatus: Counts<CommandStatus & string>;
    byType: Counts;
  };
  inFlight: number;
}

/** Ligne de GET /admin/commands (journal inter-organisations). */
export interface AdminCommand {
  id: string;
  organizationId: string;
  deviceId: string;
  vehicleId: string | null;
  commandType: string;
  status: CommandStatus;
  reason: string;
  origin: string;
  requestedBy: string | null;
  requestedAt: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  expiresAt: string;
  organization: OrganizationSummary | null;
}

export interface AdminCommandListParams extends PaginationParams {
  organizationId?: string;
  deviceId?: string;
  vehicleId?: string;
  status?: CommandStatus;
  commandType?: string;
  /** ISO 8601 */
  from?: string;
  /** ISO 8601 */
  to?: string;
}

/** Fenêtres proposées par le tableau de bord (le back-end accepte 7 à 90 jours). */
export const ACTIVITY_WINDOWS = [7, 30, 90] as const;
export type ActivityWindow = (typeof ACTIVITY_WINDOWS)[number];

export interface ActivityParams extends AdminStatsParams {
  days?: number;
}

/** Un point par jour (UTC = heure d'Abidjan), jours vides compris. */
export interface ActivityDay {
  /** AAAA-MM-JJ */
  date: string;
  positions: number;
  activeVehicles: number;
  trips: number;
  distanceKm: number;
  commands: { total: number; acknowledged: number; failed: number; other: number };
  alerts: number;
  created: { vehicles: number; devices: number; users: number };
  /** Effectifs cumulés en fin de journée. */
  totals: { vehicles: number; devices: number; users: number };
}

/** GET /admin/stats/activity */
export interface ActivityReport {
  from: string;
  to: string;
  days: ActivityDay[];
}
