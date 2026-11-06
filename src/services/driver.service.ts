import { adminPath, api } from "@/lib/axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  CreateDriverPayload,
  Driver,
  DriverDetail,
  DriverGroupSummary,
  DriverGroupsChange,
  DriverListParams,
  DriverOrganizationChange,
  UpdateDriverPayload,
} from "@/types/driver";

/**
 * Conducteurs — routes `/admin/drivers` : toutes les organisations et le
 * vivier sans organisation (`?withoutOrganization=true`).
 */
export const driverService = {
  /** GET /admin/drivers?organizationId=&withoutOrganization=&search=&status=&vehicleId=&driverGroupId= */
  async list(params: DriverListParams = {}): Promise<Paginated<Driver>> {
    const { data } = await api.get<Paginated<Driver>>(adminPath("/drivers"), { params });
    return data;
  },

  /** GET /admin/drivers/:id — véhicule et groupes inclus. */
  async get(id: string): Promise<DriverDetail> {
    const { data } = await api.get<ApiResponse<DriverDetail>>(adminPath(`/drivers/${id}`));
    return data.data;
  },

  /** POST /admin/drivers — `organizationId` facultatif (absent = vivier). */
  async create(payload: CreateDriverPayload): Promise<Driver> {
    const { data } = await api.post<ApiResponse<Driver>>(adminPath("/drivers"), payload);
    return data.data;
  },

  /** PATCH /admin/drivers/:id — `null` efface un champ. */
  async update(id: string, payload: UpdateDriverPayload): Promise<Driver> {
    const { data } = await api.patch<ApiResponse<Driver>>(adminPath(`/drivers/${id}`), payload);
    return data.data;
  },

  /** DELETE /admin/drivers/:id — suppression logique (détaché de son véhicule). */
  async remove(id: string): Promise<void> {
    await api.delete(adminPath(`/drivers/${id}`));
  },

  /** PUT /admin/drivers/:id/vehicle — `null` détache. */
  async assignVehicle(id: string, vehicleId: string | null): Promise<Driver> {
    const { data } = await api.put<ApiResponse<Driver>>(adminPath(`/drivers/${id}/vehicle`), { vehicleId });
    return data.data;
  },

  /**
   * PUT /admin/drivers/:id/organization — ajoute ou DÉPLACE le conducteur.
   * Véhicule incompatible retiré, groupes de l'ancienne organisation quittés.
   */
  async assignOrganization(id: string, organizationId: string): Promise<DriverOrganizationChange> {
    const { data } = await api.put<ApiResponse<DriverOrganizationChange>>(adminPath(`/drivers/${id}/organization`), {
      organizationId,
    });
    return data.data;
  },

  /** DELETE /admin/drivers/:id/organization — retour au vivier. */
  async removeOrganization(id: string): Promise<DriverOrganizationChange> {
    const { data } = await api.delete<ApiResponse<DriverOrganizationChange>>(adminPath(`/drivers/${id}/organization`));
    return data.data;
  },

  /** GET /admin/drivers/:id/groups */
  async groups(id: string): Promise<DriverGroupSummary[]> {
    const { data } = await api.get<ApiResponse<DriverGroupSummary[]>>(adminPath(`/drivers/${id}/groups`));
    return data.data;
  },

  /** POST /admin/drivers/:id/groups — groupes de la même organisation, idempotent. */
  async attachGroups(id: string, driverGroupIds: string[]): Promise<DriverGroupsChange> {
    const { data } = await api.post<ApiResponse<DriverGroupsChange>>(adminPath(`/drivers/${id}/groups`), {
      driverGroupIds,
    });
    return data.data;
  },

  /** DELETE /admin/drivers/:id/groups/:groupId */
  async detachGroup(id: string, groupId: string): Promise<void> {
    await api.delete(adminPath(`/drivers/${id}/groups/${groupId}`));
  },

  /** GET /vehicles/:id/drivers (route client, ouverte au joker `*`). */
  async ofVehicle(vehicleId: string): Promise<Driver[]> {
    const { data } = await api.get<ApiResponse<Driver[]>>(`/vehicles/${vehicleId}/drivers`);
    return data.data;
  },
};
