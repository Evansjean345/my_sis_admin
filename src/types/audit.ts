import type { PaginationParams } from "./api";

/**
 * Journal d'audit — LECTURE SEULE.
 *
 * `audit_logs` est append-only et partitionnée par mois : aucune route
 * n'écrit, ne modifie ni ne supprime. Toute recherche est bornée par une
 * fenêtre temporelle (défaut : 30 jours glissants, plafond : 366 jours),
 * sinon PostgreSQL balaierait toutes les partitions.
 */

/** Fenêtre réellement appliquée par l'API, renvoyée dans `meta`. */
export interface AuditWindow {
  from: string;
  to: string;
}

/**
 * `meta` du journal : format Lucid SANS les URLs de page, PLUS la fenêtre.
 * D'où un type dédié plutôt que `PaginationMeta`.
 */
export interface AuditPaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  window: AuditWindow;
}

export interface AuditLogPage {
  meta: AuditPaginationMeta;
  data: AuditLogEntry[];
}

/** Types de ressources rencontrés dans le journal (liste ouverte). */
export type AuditResourceType =
  | "organization"
  | "user"
  | "vehicle"
  | "device"
  | "vehicle_group"
  | "device_group"
  | "driver"
  | "driver_group"
  | "usage_schedule"
  | "device_command"
  | "geofence"
  | "policy"
  | (string & {});

export interface AuditLogEntry {
  /** `bigint` sérialisé en chaîne : au-delà de 2^53 un `number` perdrait des unités. */
  id: string;
  organizationId: string | null;
  actorId: string | null;
  /** `user`, `system`, `api`… */
  actorType: string;
  /** Joint en LEFT JOIN : un compte supprimé continue d'apparaître. */
  actorEmail: string | null;
  actorName: string | null;
  actorIp: string | null;
  /** Nomenclature `domaine.ressource.action`, ex. `fleet.vehicle_group.members_added`. */
  action: string;
  resourceType: AuditResourceType;
  resourceId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface AuditLogListParams extends PaginationParams {
  /** Instants ISO 8601. `from` doit être antérieur à `to` (422 `E_INVALID_WINDOW`). */
  from?: string;
  to?: string;
  action?: string;
  resourceType?: AuditResourceType;
  resourceId?: string;
  actorId?: string;
  /** Réservé à l'exploitant plateforme ; 403 pour un administrateur client visant une autre organisation. */
  organizationId?: string;
}

/** GET /audit-logs/actions — alimente le filtre sans faire deviner la nomenclature. */
export interface AuditActions {
  data: string[];
  meta: { window: AuditWindow };
}

/** Plafond de la fenêtre de consultation, en jours (au-delà : `E_WINDOW_TOO_WIDE`). */
export const AUDIT_MAX_WINDOW_DAYS = 366;

/** Fenêtre appliquée par l'API quand l'appelant n'en donne pas. */
export const AUDIT_DEFAULT_WINDOW_DAYS = 30;

/** Plafond de `perPage` côté API. */
export const AUDIT_MAX_PER_PAGE = 200;
