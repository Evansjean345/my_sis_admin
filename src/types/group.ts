import type { OrganizationSummary } from "./admin";
import type { PaginationParams } from "./api";

/**
 * Groupes de véhicules (flottes) et groupes de boîtiers (lots).
 *
 * Les deux familles sont SYMÉTRIQUES côté API : mêmes champs, mêmes règles,
 * mêmes codes d'erreur. Seuls changent le préfixe d'URL et la clé du corps
 * d'affectation (`vehicleIds` / `deviceIds`). Les types le restent aussi —
 * une divergence de forme ici serait une surprise, pas une fonctionnalité.
 */

/**
 * `vehicle_group` | `device_group` | `driver_group` — type de ressource dans
 * le journal d'audit. Les groupes de conducteurs (migration 018) suivent le
 * même contrat que les deux familles historiques.
 */
export type GroupKind = "vehicle_group" | "device_group" | "driver_group";

export interface Group {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  /** Format `#RRGGBB`, ou `null` si non renseigné. */
  color: string | null;
  createdAt: string;
  updatedAt: string;
  /** Effectif du groupe, calculé par l'API en une requête agrégée. */
  membersCount: number;
  /** Organisation propriétaire — ajoutée par les listes et détails `/admin/*`. */
  organization?: OrganizationSummary | null;
}

/**
 * Membre d'un groupe.
 *
 * `label` est l'étiquette d'affichage choisie par l'API : immatriculation
 * pour un véhicule, IMEI pour un boîtier.
 */
export interface GroupMember {
  id: string;
  label: string;
  addedAt: string;
}

/** GET /vehicle-groups/:id · GET /device-groups/:id */
export interface GroupDetail extends Group {
  members: GroupMember[];
}

/**
 * Résultat d'une affectation en lot — l'opération est IDEMPOTENTE.
 *
 *   applied   : effectivement ajoutés
 *   unchanged : déjà membres (rejouer la même sélection n'est pas une erreur)
 *   rejected  : inconnus, supprimés, ou appartenant à une AUTRE organisation
 *
 * Un lot ENTIÈREMENT refusé donne un 422 `E_MEMBERS_OUT_OF_SCOPE`.
 */
export interface MembershipChange {
  applied: string[];
  unchanged: string[];
  rejected: string[];
}

export interface GroupListParams extends PaginationParams {
  search?: string;
  /** Filtre admin : une seule organisation. */
  organizationId?: string;
}

export interface CreateGroupPayload {
  /** Organisation propriétaire — exigée par les créations `POST /admin/*`. */
  organizationId: string;
  /** 2 à 80 caractères, unique par organisation (casse ignorée). */
  name: string;
  description?: string;
  /** `#RRGGBB` — toute autre écriture est refusée en 422. */
  color?: string;
}

/** L'organisation d'un groupe est figée à la création. */
export type UpdateGroupPayload = Partial<Omit<CreateGroupPayload, "organizationId">>;

/** Plafond d'un lot d'affectation côté API : au-delà, c'est un import. */
export const MAX_GROUP_MEMBERS = 200;

/** Palette proposée dans le formulaire — des couleurs lisibles en clair comme en sombre. */
export const GROUP_COLORS = [
  "#1D4ED8",
  "#0EA5E9",
  "#059669",
  "#65A30D",
  "#CA8A04",
  "#EA580C",
  "#B91C1C",
  "#DB2777",
  "#7C3AED",
  "#475569",
] as const;
