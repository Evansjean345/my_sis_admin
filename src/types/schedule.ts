import type { OrganizationSummary } from "./admin";
import type { PaginationParams } from "./api";

/**
 * Calendriers d'utilisation et immobilisation planifiée (migration 017).
 *
 * Un calendrier = un fuseau IANA + des plages hebdomadaires. Rattaché à des
 * véhicules et/ou à des flottes (groupes de véhicules), avec un mode :
 *
 *   allowed    le véhicule ne roule QUE pendant les plages
 *   forbidden  le véhicule ne roule PAS pendant les plages
 *
 * Le moteur `node ace sisbm:schedules:enforce` applique ces calendriers en
 * passant par les mêmes garde-fous que l'opérateur (vitesse, relais…).
 */

export const SCHEDULE_MODES = ["allowed", "forbidden"] as const;
export type ScheduleMode = (typeof SCHEDULE_MODES)[number];

/** 0 = dimanche … 6 = samedi (convention PostgreSQL `EXTRACT(DOW)`). */
export const DAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
/** Ordre d'affichage : la semaine commence le lundi. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export interface ScheduleWindow {
  id?: string;
  dayOfWeek: number;
  /** `HH:MM` — `24:00` admis comme fin de journée. */
  startTime: string;
  endTime: string;
}

export interface UsageSchedule {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  windows: ScheduleWindow[];
  vehiclesCount?: number;
  vehicleGroupsCount?: number;
  /** Ajoutée par les listes `/admin/*`. */
  organization?: OrganizationSummary | null;
}

/** Véhicule ou flotte rattaché à un calendrier. */
export interface ScheduleTarget {
  id: string;
  /** Immatriculation (véhicule) ou nom (flotte). */
  label: string;
  mode: ScheduleMode;
  createdAt: string;
}

export interface UsageScheduleDetail extends UsageSchedule {
  vehicles: ScheduleTarget[];
  vehicleGroups: ScheduleTarget[];
}

export interface ScheduleListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  organizationId?: string;
}

export interface CreateSchedulePayload {
  organizationId: string;
  name: string;
  description?: string;
  timezone?: string;
  isActive?: boolean;
  windows?: Omit<ScheduleWindow, "id">[];
}

export type UpdateSchedulePayload = Partial<Omit<CreateSchedulePayload, "organizationId" | "description">> & {
  description?: string | null;
};

/** Résultat d'un rattachement — idempotent. */
export interface ScheduleAssignmentChange {
  applied: string[];
  /** Déjà rattachés, mode modifié. */
  updated: string[];
  unchanged: string[];
  rejected: string[];
}

// ---------------------------------------------------------------------------
// Moteur : décisions et état
// ---------------------------------------------------------------------------

export type DesiredUsage = "free" | "immobilized";

export type UsageCause =
  | "no_schedule"
  | "forbidden_window"
  | "outside_allowed_windows"
  | "inside_allowed_window"
  | "outside_forbidden_windows";

export type EnforcementAction = "cut" | "restore";

export type EnforcementOutcome =
  | "idle"
  | "dispatch"
  | "waiting_in_flight"
  | "waiting_retry"
  | "completed"
  | "overridden"
  | "manual_cut_kept"
  | "already_immobilized";

/** GET /usage-schedules/:id/preview — une ligne par véhicule. */
export interface EnforcementPreviewEntry {
  vehicleId: string;
  registration: string;
  organizationId: string;
  desired: DesiredUsage;
  cause: UsageCause;
  schedule: { id: string; name: string; source: string } | null;
  outcome: EnforcementOutcome;
  action: EnforcementAction | null;
  pendingAction: EnforcementAction | null;
}

export interface EnforcementPreview {
  data: EnforcementPreviewEntry[];
  meta: { evaluatedAt: string; total: number; isActive: boolean; note?: string };
}

export type ScheduleSource = { type: "vehicle" } | { type: "group"; groupId: string; groupName: string };

/** GET /vehicles/:id/schedule-status */
export interface VehicleScheduleStatus {
  vehicleId: string;
  registration?: string;
  /** `false` : aucun calendrier, le moteur ignore ce véhicule. */
  managed: boolean;
  schedules: Array<{
    id: string;
    name: string;
    timezone: string;
    mode: ScheduleMode;
    source: ScheduleSource;
    windows: ScheduleWindow[];
  }>;
  verdict: { state: DesiredUsage; cause: UsageCause; schedule: { id: string; name: string } | null };
  enforcement: {
    stored: {
      desired: DesiredUsage;
      pendingAction: EnforcementAction | null;
      pendingSince: string | null;
      nextAttemptAt: string | null;
      attempts: number;
      lastErrorCode: string | null;
      lastErrorMessage: string | null;
      lastOutcome: EnforcementOutcome | null;
      evaluatedAt: string;
    } | null;
    nextDecision: { outcome: EnforcementOutcome; action: EnforcementAction | null };
    commandInFlight: boolean;
  } | null;
  lastConfirmedEngineCommand: { commandType: "engine_cut" | "engine_restore"; origin: string; at: string } | null;
  evaluatedAt: string;
}

/** GET /vehicle-groups/:id/schedules */
export interface GroupScheduleSummary {
  id: string;
  name: string;
  mode: ScheduleMode;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Libellés
// ---------------------------------------------------------------------------

export const scheduleModeLabels: Record<ScheduleMode, string> = {
  allowed: "Autorisé",
  forbidden: "Interdit",
};

export const scheduleModeHints: Record<ScheduleMode, string> = {
  allowed: "Le véhicule ne roule que pendant les plages ; immobilisé en dehors.",
  forbidden: "Le véhicule est immobilisé pendant les plages.",
};

export const usageCauseLabels: Record<UsageCause, string> = {
  no_schedule: "Aucun calendrier",
  forbidden_window: "Plage interdite en cours",
  outside_allowed_windows: "Hors des plages autorisées",
  inside_allowed_window: "Plage autorisée en cours",
  outside_forbidden_windows: "Hors des plages interdites",
};

export const enforcementOutcomeLabels: Record<EnforcementOutcome, string> = {
  idle: "Rien à faire",
  dispatch: "Commande émise",
  waiting_in_flight: "Commande en cours",
  waiting_retry: "Nouvelle tentative programmée",
  completed: "Objectif atteint",
  overridden: "Dérogation opérateur",
  manual_cut_kept: "Coupure manuelle conservée",
  already_immobilized: "Déjà immobilisé",
};

export const DEFAULT_TIMEZONE = "Africa/Abidjan";

// ---------------------------------------------------------------------------
// Historique réel — GET /admin/usage-schedules/analytics
// ---------------------------------------------------------------------------

export interface ScheduleHistoryParams {
  organizationId?: string;
  /** Dates civiles incluses (AAAA-MM-JJ), 93 jours au plus. */
  from: string;
  to: string;
  timezone?: string;
}

export interface CommandTally {
  requested: number;
  acknowledged: number;
  failed: number;
  expired: number;
  cancelled: number;
  inFlight: number;
}

export interface LatencyStats {
  /** Secondes. */
  median: number | null;
  p90: number | null;
  samples: number;
}

export interface ScheduleHistoryDay {
  date: string;
  cut: CommandTally;
  restore: CommandTally;
  refusals: number;
  refusedVehicles: number;
  overrides: number;
  manualCutsKept: number;
  transitionsToImmobilized: number;
  transitionsToFree: number;
  completed: number;
  hours: { cut: number[]; restore: number[]; refused: number[] };
}

export interface ScheduleHistory {
  range: { from: string; to: string; timezone: string; startsAt: string; endsAt: string };
  totals: {
    cut: CommandTally;
    restore: CommandTally;
    refusals: number;
    refusedVehicles: number;
    overrides: number;
    manualCutsKept: number;
    alreadyImmobilized: number;
    transitionsToImmobilized: number;
    transitionsToFree: number;
    vehicles: number;
    /** Demande → acquittement du boîtier. */
    commandLatency: { cut: LatencyStats; restore: LatencyStats };
    /** Entrée / sortie de plage → objectif confirmé. */
    executionDelay: { cut: LatencyStats; restore: LatencyStats };
  };
  refusalsByCode: Array<{ code: string; count: number; vehicles: number }>;
  days: ScheduleHistoryDay[];
  vehicles: Array<{
    id: string;
    registration: string | null;
    organizationId: string;
    cuts: number;
    restores: number;
    failures: number;
    refusals: number;
    overrides: number;
  }>;
  schedules: Array<{
    id: string;
    name: string;
    organizationId: string;
    transitionsToImmobilized: number;
    dispatched: number;
    acknowledged: number;
    refusals: number;
    overrides: number;
    completed: number;
    medianExecutionSeconds: number | null;
  }>;
  /** Premier événement journalisé : avant, refus et dérogations sont inconnus. */
  journalSince: string | null;
}

/** Motifs de refus du moteur : codes d'API → libellés métier. */
export const refusalLabels: Record<string, string> = {
  E_VEHICLE_IN_MOTION: "Véhicule en mouvement (garde-fou de vitesse)",
  E_NO_POSITION: "Aucune position connue",
  E_STALE_POSITION: "Position trop ancienne",
  E_COMMAND_IN_FLIGHT: "Commande déjà en cours sur le boîtier",
  E_DEVICE_NO_RELAY: "Boîtier sans relais de coupure",
  E_NO_DEVICE: "Aucun boîtier associé",
  E_IMMOBILIZATION_DISABLED: "Immobilisation désactivée",
  E_DISPATCH_FAILED: "Échec d'envoi à la passerelle",
  E_UNKNOWN: "Motif inconnu",
};
