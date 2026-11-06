import type { OrganizationSummary } from "./admin";
import type { PaginationParams } from "./api";

/**
 * Conducteurs (migrations 018 et 019).
 *
 * L'organisation est FACULTATIVE : `null` = vivier de l'exploitant, hors de
 * tout client. Un conducteur rattaché à une organisation ne conduit que les
 * véhicules de celle-ci ; un conducteur du vivier peut être rattaché au
 * véhicule de n'importe quel client.
 */

export const DRIVER_STATUSES = ["active", "inactive", "suspended"] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

/** Catégories du permis de conduire ivoirien. */
export const LICENSE_CATEGORIES = ["A", "A1", "B", "C", "D", "E", "F"] as const;
export type LicenseCategory = (typeof LICENSE_CATEGORIES)[number];

export interface DriverVehicleSummary {
  id: string;
  registration: string;
  label: string | null;
}

export interface DriverGroupSummary {
  id: string;
  name: string;
  color: string | null;
  addedAt?: string | null;
}

export interface Driver {
  id: string;
  organizationId: string | null;
  vehicleId: string | null;
  firstName: string;
  lastName: string;
  /** Colonne générée par PostgreSQL : prénom + nom. */
  fullName: string;
  phone: string | null;
  email: string | null;
  employeeCode: string | null;
  licenseNumber: string | null;
  licenseCategories: LicenseCategory[];
  /** `AAAA-MM-JJ` */
  licenseExpiresOn: string | null;
  status: DriverStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Résumé du véhicule rattaché (listes, détail). */
  vehicle?: DriverVehicleSummary | null;
  /** Ajoutée par les listes `/admin/*` — `null` pour le vivier. */
  organization?: OrganizationSummary | null;
}

export interface DriverDetail extends Driver {
  groups: DriverGroupSummary[];
}

export interface DriverListParams extends PaginationParams {
  /** Nom, matricule ou numéro de permis. */
  search?: string;
  status?: DriverStatus;
  vehicleId?: string;
  driverGroupId?: string;
  unassigned?: boolean;
  organizationId?: string;
  /** `true` : seulement le vivier sans organisation. */
  withoutOrganization?: boolean;
}

export interface CreateDriverPayload {
  /** Facultative : absente ou `null` = vivier de l'exploitant. */
  organizationId?: string | null;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  employeeCode?: string;
  licenseNumber?: string;
  licenseCategories?: LicenseCategory[];
  licenseExpiresOn?: string;
  status?: DriverStatus;
  vehicleId?: string;
  notes?: string;
}

/** `null` efface un champ. */
export interface UpdateDriverPayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  employeeCode?: string | null;
  licenseNumber?: string | null;
  licenseCategories?: LicenseCategory[];
  licenseExpiresOn?: string | null;
  status?: DriverStatus;
  vehicleId?: string | null;
  notes?: string | null;
}

/** PUT / DELETE /admin/drivers/:id/organization */
export interface DriverOrganizationChange extends Driver {
  unchanged?: boolean;
  /** Le véhicule a été retiré (il appartenait à l'organisation quittée). */
  vehicleDetached: boolean;
  /** Nombre de groupes de l'ancienne organisation quittés. */
  groupsLeft: number;
}

/** POST /drivers/:id/groups */
export interface DriverGroupsChange {
  applied: string[];
  unchanged: string[];
  rejected: string[];
  groups: DriverGroupSummary[];
}

export const driverStatusMeta: Record<DriverStatus, { label: string; tone: "success" | "neutral" | "danger" }> = {
  active: { label: "Actif", tone: "success" },
  inactive: { label: "Inactif", tone: "neutral" },
  suspended: { label: "Suspendu", tone: "danger" },
};
