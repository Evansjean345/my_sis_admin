import type { OrganizationSummary } from "@shared/types/admin";
import type { PaginationParams } from "@shared/types/api";
import type { UserRole } from "@shared/types/role";

export type UserStatus = "pending" | "active" | "suspended";

export interface User {
  id: string;
  organizationId: string;
  roleId: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  locale: "fr" | "en";
  timezone: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Organisation propriétaire — ajoutée par les listes et détails `/admin/*`. */
  organization?: OrganizationSummary | null;
  /** Rôle résumé — ajouté par la liste `/admin/users`. */
  role?: { id: string; code: string; name: string } | null;
}

export interface UserDetail extends Omit<User, "role"> {
  role?: UserRole;
}

export interface UserListParams extends PaginationParams {
  status?: UserStatus;
  /** Filtres admin. */
  organizationId?: string;
  roleId?: string;
  /** Nom complet ou e-mail. */
  search?: string;
}

export interface CreateUserPayload {
  /** Organisation propriétaire — exigée par les créations `POST /admin/*`. */
  organizationId: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleId: string;
  status?: UserStatus;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  roleId?: string;
  status?: UserStatus;
  locale?: "fr" | "en";
  timezone?: string;
}
