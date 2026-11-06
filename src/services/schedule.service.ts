import { adminPath, api } from "@/lib/axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type {
  CreateSchedulePayload,
  EnforcementPreview,
  GroupScheduleSummary,
  ScheduleAssignmentChange,
  ScheduleHistory,
  ScheduleHistoryParams,
  ScheduleListParams,
  ScheduleMode,
  ScheduleTarget,
  ScheduleWindow,
  UpdateSchedulePayload,
  UsageSchedule,
  UsageScheduleDetail,
  VehicleScheduleStatus,
} from "@/types/schedule";

/**
 * Calendriers d'utilisation — routes `/admin/usage-schedules` : toutes les
 * organisations. La création exige `organizationId`.
 *
 * L'état planifié d'un véhicule et les calendriers d'une flotte n'ont pas de
 * variante admin : ils passent par les routes client, ouvertes au joker `*`.
 */
export const scheduleService = {
  /**
   * GET /admin/usage-schedules/analytics?from=&to=&timezone=&organizationId=
   * Historique RÉEL du moteur planifié, agrégé par le back-end.
   */
  async history(params: ScheduleHistoryParams): Promise<ScheduleHistory> {
    const { data } = await api.get<ApiResponse<ScheduleHistory>>(adminPath("/usage-schedules/analytics"), { params });
    return data.data;
  },

  /** GET /admin/usage-schedules?organizationId=&search=&isActive=&page=&perPage= */
  async list(params: ScheduleListParams = {}): Promise<Paginated<UsageSchedule>> {
    const { data } = await api.get<Paginated<UsageSchedule>>(adminPath("/usage-schedules"), { params });
    return data;
  },

  /** GET /admin/usage-schedules/:id — plages, véhicules et flottes rattachés. */
  async get(id: string): Promise<UsageScheduleDetail> {
    const { data } = await api.get<ApiResponse<UsageScheduleDetail>>(adminPath(`/usage-schedules/${id}`));
    return data.data;
  },

  /** POST /admin/usage-schedules — plages incluses, écriture atomique. */
  async create(payload: CreateSchedulePayload): Promise<UsageSchedule> {
    const { data } = await api.post<ApiResponse<UsageSchedule>>(adminPath("/usage-schedules"), payload);
    return data.data;
  },

  /** PATCH /admin/usage-schedules/:id — `windows`, si fourni, remplace la semaine. */
  async update(id: string, payload: UpdateSchedulePayload): Promise<UsageSchedule> {
    const { data } = await api.patch<ApiResponse<UsageSchedule>>(adminPath(`/usage-schedules/${id}`), payload);
    return data.data;
  },

  /** DELETE /admin/usage-schedules/:id — suppression logique. */
  async remove(id: string): Promise<void> {
    await api.delete(adminPath(`/usage-schedules/${id}`));
  },

  /** PUT /admin/usage-schedules/:id/windows — la semaine entière. */
  async replaceWindows(id: string, windows: Omit<ScheduleWindow, "id">[]): Promise<ScheduleWindow[]> {
    const { data } = await api.put<ApiResponse<ScheduleWindow[]>>(adminPath(`/usage-schedules/${id}/windows`), {
      windows,
    });
    return data.data;
  },

  /** POST /admin/usage-schedules/:id/vehicles — idempotent. */
  async attachVehicles(id: string, vehicleIds: string[], mode: ScheduleMode): Promise<ScheduleAssignmentChange> {
    const { data } = await api.post<ApiResponse<ScheduleAssignmentChange>>(
      adminPath(`/usage-schedules/${id}/vehicles`),
      { vehicleIds, mode },
    );
    return data.data;
  },

  async detachVehicle(id: string, vehicleId: string): Promise<void> {
    await api.delete(adminPath(`/usage-schedules/${id}/vehicles/${vehicleId}`));
  },

  /** POST /admin/usage-schedules/:id/vehicle-groups — calendrier de flotte. */
  async attachGroups(id: string, vehicleGroupIds: string[], mode: ScheduleMode): Promise<ScheduleAssignmentChange> {
    const { data } = await api.post<ApiResponse<ScheduleAssignmentChange>>(
      adminPath(`/usage-schedules/${id}/vehicle-groups`),
      { vehicleGroupIds, mode },
    );
    return data.data;
  },

  async detachGroup(id: string, groupId: string): Promise<void> {
    await api.delete(adminPath(`/usage-schedules/${id}/vehicle-groups/${groupId}`));
  },

  async vehicles(id: string): Promise<ScheduleTarget[]> {
    const { data } = await api.get<ApiResponse<ScheduleTarget[]>>(adminPath(`/usage-schedules/${id}/vehicles`));
    return data.data;
  },

  async groups(id: string): Promise<ScheduleTarget[]> {
    const { data } = await api.get<ApiResponse<ScheduleTarget[]>>(adminPath(`/usage-schedules/${id}/vehicle-groups`));
    return data.data;
  },

  /** GET /admin/usage-schedules/:id/preview?at= — simulation, rien n'est émis. */
  async preview(id: string, at?: string): Promise<EnforcementPreview> {
    const { data } = await api.get<EnforcementPreview>(adminPath(`/usage-schedules/${id}/preview`), {
      params: at ? { at } : undefined,
    });
    return data;
  },

  /** GET /vehicles/:id/schedule-status (route client, ouverte au joker `*`). */
  async vehicleStatus(vehicleId: string): Promise<VehicleScheduleStatus> {
    const { data } = await api.get<ApiResponse<VehicleScheduleStatus>>(`/vehicles/${vehicleId}/schedule-status`);
    return data.data;
  },

  /** GET /vehicle-groups/:id/schedules (route client, ouverte au joker `*`). */
  async groupSchedules(groupId: string): Promise<GroupScheduleSummary[]> {
    const { data } = await api.get<ApiResponse<GroupScheduleSummary[]>>(`/vehicle-groups/${groupId}/schedules`);
    return data.data;
  },
};
