import { adminPath, api } from "@/lib/axios";
import type { ApiResponse, Paginated } from "@/types/api";
import type { AuditLogListParams, AuditLogPage } from "@/types/audit";
import type {
  CreateGroupPayload,
  Group,
  GroupDetail,
  GroupListParams,
  GroupMember,
  MembershipChange,
  UpdateGroupPayload,
} from "@/types/group";

/**
 * Groupes de véhicules, de boîtiers et de conducteurs.
 *
 * Le back-end sert les deux familles depuis un socle commun
 * (`GroupControllerBase`) : mêmes routes à un segment près, même corps à une
 * clé près. Une fabrique suffit donc ici aussi — deux fichiers jumeaux
 * dériveraient tôt ou tard.
 *
 * Routes `/admin/<famille>` : toutes les organisations. La liste accepte
 * `?organizationId=` et la création EXIGE `organizationId`.
 */
interface GroupEndpoints {
  /** Segment d'URL : `vehicle-groups` | `device-groups` | `driver-groups`. */
  resource: "vehicle-groups" | "device-groups" | "driver-groups";
  /** Segment des membres : `vehicles` | `devices` | `drivers`. */
  members: "vehicles" | "devices" | "drivers";
  /** Clé du corps d'affectation : `vehicleIds` | `deviceIds` | `driverIds`. */
  payloadKey: "vehicleIds" | "deviceIds" | "driverIds";
}

function createGroupService({ resource, members, payloadKey }: GroupEndpoints) {
  return {
    /** GET /:famille?page=&perPage=&search= — chaque ligne porte son effectif. */
    async list(params: GroupListParams = {}): Promise<Paginated<Group>> {
      const { data } = await api.get<Paginated<Group>>(adminPath(`/${resource}`), { params });
      return data;
    },

    /** GET /:famille/:id — le groupe ET la liste complète de ses membres. */
    async get(id: string): Promise<GroupDetail> {
      const { data } = await api.get<ApiResponse<GroupDetail>>(adminPath(`/${resource}/${id}`));
      return data.data;
    },

    /** POST /:famille — 409 `E_GROUP_NAME_TAKEN` si le nom est déjà pris. */
    async create(payload: CreateGroupPayload): Promise<Group> {
      const { data } = await api.post<ApiResponse<Group>>(adminPath(`/${resource}`), payload);
      return data.data;
    },

    /** PATCH /:famille/:id */
    async update(id: string, payload: UpdateGroupPayload): Promise<Group> {
      const { data } = await api.patch<ApiResponse<Group>>(adminPath(`/${resource}/${id}`), payload);
      return data.data;
    },

    /** DELETE /:famille/:id — suppression LOGIQUE : le groupe reste référencé par l'audit. */
    async remove(id: string): Promise<void> {
      await api.delete(adminPath(`/${resource}/${id}`));
    },

    /** GET /:famille/:id/(vehicles|devices) — membres seuls. */
    async members(id: string): Promise<GroupMember[]> {
      const { data } = await api.get<ApiResponse<GroupMember[], { total: number }>>(
        adminPath(`/${resource}/${id}/${members}`),
      );
      return data.data;
    },

    /** POST /:famille/:id/(vehicles|devices) — affectation en lot, idempotente (≤ 200). */
    async assign(id: string, memberIds: string[]): Promise<MembershipChange> {
      const { data } = await api.post<ApiResponse<MembershipChange>>(adminPath(`/${resource}/${id}/${members}`), {
        [payloadKey]: memberIds,
      });
      return data.data;
    },

    /** DELETE /:famille/:id/(vehicles|devices)/:memberId — 404 si le membre n'est plus du groupe. */
    async unassign(id: string, memberId: string): Promise<void> {
      await api.delete(adminPath(`/${resource}/${id}/${members}/${memberId}`));
    },

    /**
     * GET /:famille/:id/audit-logs — journal du groupe.
     *
     * Réunit trois ensembles : le groupe, ses membres, et les COMMANDES
     * émises sur ces membres (les immobilisations sont tracées sous
     * `device_command`, jamais sous `vehicle` ni `device`).
     */
    async auditLogs(id: string, params: AuditLogListParams = {}): Promise<AuditLogPage> {
      const { data } = await api.get<AuditLogPage>(adminPath(`/${resource}/${id}/audit-logs`), { params });
      return data;
    },
  };
}

export type GroupService = ReturnType<typeof createGroupService>;

export const vehicleGroupService = createGroupService({
  resource: "vehicle-groups",
  members: "vehicles",
  payloadKey: "vehicleIds",
});

export const deviceGroupService = createGroupService({
  resource: "device-groups",
  members: "devices",
  payloadKey: "deviceIds",
});

/** Groupes de conducteurs (migration 018) — même socle côté API. */
export const driverGroupService = createGroupService({
  resource: "driver-groups",
  members: "drivers",
  payloadKey: "driverIds",
});
