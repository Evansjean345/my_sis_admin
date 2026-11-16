import { adminPath, api } from "@shared/lib/axios";
import type { ApiResponse, Paginated } from "@shared/types/api";
import type { AuditLogListParams, AuditLogPage } from "@shared/types/audit";
import type {
  CreatedOrganization,
  CreatedUserAccount,
  CreateOrganizationPayload,
  CreateOrganizationUserPayload,
  Organization,
  OrganizationDetail,
  OrganizationListParams,
  OrganizationRole,
  OrganizationUser,
  UpdateOrganizationPayload,
} from "@shared/types/organization";
import type { UserListParams } from "@shared/types/user";

/**
 * Organisations — réservé à l'exploitant plateforme (joker `*`).
 *
 * Un administrateur client reçoit 403 sur ces routes : l'écran doit le
 * traiter comme un refus d'habilitation, pas comme une liste vide.
 */
export const organizationService = {
  /** GET /organizations?page=&perPage=&search=&isActive= */
  async list(params: OrganizationListParams = {}): Promise<Paginated<Organization>> {
    const { data } = await api.get<Paginated<Organization>>(adminPath("/organizations"), { params });
    return data;
  },

  /** GET /organizations/:id — inclut les compteurs utilisateurs / véhicules. */
  async get(id: string): Promise<OrganizationDetail> {
    const { data } = await api.get<ApiResponse<OrganizationDetail>>(adminPath(`/organizations/${id}`));
    return data.data;
  },

  /** POST /organizations — l'organisation et son premier administrateur, en une transaction. */
  async create(payload: CreateOrganizationPayload): Promise<CreatedOrganization> {
    const { data } = await api.post<ApiResponse<CreatedOrganization>>(adminPath("/organizations"), payload);
    return data.data;
  },

  /** PATCH /organizations/:id — le `code` n'est pas modifiable. */
  async update(id: string, payload: UpdateOrganizationPayload): Promise<Organization> {
    const { data } = await api.patch<ApiResponse<Organization>>(adminPath(`/organizations/${id}`), payload);
    return data.data;
  },

  /** GET /organizations/:id/roles — `assignable` reflète ce que l'écriture acceptera. */
  async roles(id: string): Promise<OrganizationRole[]> {
    const { data } = await api.get<ApiResponse<OrganizationRole[]>>(adminPath(`/organizations/${id}/roles`));
    return data.data;
  },

  /** GET /organizations/:id/users?page=&perPage=&status= */
  async users(id: string, params: UserListParams = {}): Promise<Paginated<OrganizationUser>> {
    const { data } = await api.get<Paginated<OrganizationUser>>(adminPath(`/organizations/${id}/users`), { params });
    return data;
  },

  /** POST /organizations/:id/users — rattache un compte à l'organisation désignée. */
  async createUser(id: string, payload: CreateOrganizationUserPayload): Promise<CreatedUserAccount> {
    const { data } = await api.post<ApiResponse<CreatedUserAccount>>(adminPath(`/organizations/${id}/users`), payload);
    return data.data;
  },

  /** GET /organizations/:id/audit-logs — journal de l'organisation désignée. */
  async auditLogs(id: string, params: AuditLogListParams = {}): Promise<AuditLogPage> {
    const { data } = await api.get<AuditLogPage>(adminPath(`/organizations/${id}/audit-logs`), { params });
    return data;
  },
};
