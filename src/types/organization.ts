import type { PaginationParams } from "./api";
import type { RoleCode } from "./role";
import type { User, UserStatus } from "./user";

/**
 * Organisations (entreprises clientes).
 *
 * Routes réservées à l'exploitant plateforme (rôle `super_admin`, joker `*`).
 * Un administrateur client reçoit 403 sur `/organizations`.
 */
export interface Organization {
  id: string;
  /** Identifiant stable pour les intégrations tierces — NON modifiable après création. */
  code: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  countryCode: string | null;
  timezone: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** GET /organizations/:id — compteurs calculés par l'API. */
export interface OrganizationDetail extends Organization {
  stats: {
    users: number;
    vehicles: number;
  };
}

/**
 * GET /organizations/:id/roles.
 *
 * `assignable` est calculé par la même règle que l'écriture : le formulaire
 * ne propose que les rôles qui seront réellement acceptés (non-escalade).
 * Attention : `isSystem` est ici en camelCase, contrairement à `GET /roles`.
 */
export interface OrganizationRole {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  assignable: boolean;
}

export interface OrganizationListParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
}

/** Premier administrateur, créé dans la même transaction que l'organisation. */
export interface OrganizationAdminPayload {
  email: string;
  /** 12 caractères minimum : ce compte pourra demander une immobilisation. */
  password: string;
  fullName: string;
  phone?: string;
  locale?: "fr" | "en";
}

export interface CreateOrganizationPayload {
  /** `^[a-z0-9_-]{2,40}$` — normalisé en minuscules par l'API. */
  code: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  countryCode?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
  admin?: OrganizationAdminPayload;
}

/** Le `code` est absent : il n'est pas modifiable (contrat des intégrations). */
export interface UpdateOrganizationPayload {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  countryCode?: string;
  timezone?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

/**
 * Compte créé par l'API (POST /organizations/:id/users, ou le bloc `admin`
 * de POST /organizations) : une vue réduite du compte, jamais l'empreinte
 * du mot de passe, avec le rôle abrégé.
 */
export interface CreatedUserAccount {
  id: string;
  organizationId: string;
  roleId: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  locale: string;
  timezone: string;
  createdAt: string;
  role: { id: string; code: RoleCode };
}

/** POST /organizations — l'organisation et, le cas échéant, son administrateur. */
export interface CreatedOrganization {
  organization: Organization;
  admin: CreatedUserAccount | null;
}

/** POST /organizations/:id/users — même contrat que POST /users. */
export interface CreateOrganizationUserPayload {
  email: string;
  /** 12 caractères minimum, comme pour POST /users. */
  password: string;
  fullName: string;
  phone?: string;
  roleId: string;
  status?: UserStatus;
}

/** GET /organizations/:id/users — lignes complètes de `users`. */
export type OrganizationUser = User;
