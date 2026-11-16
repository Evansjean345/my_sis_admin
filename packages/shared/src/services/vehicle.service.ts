import { api, scopedPath } from "@shared/lib/axios";
import type { ApiResponse, Paginated } from "@shared/types/api";
import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  Vehicle,
  VehicleDetail,
  VehicleListParams,
} from "@shared/types/vehicle";

/**
 * Véhicules — routes `[/admin]/vehicles` : toutes les organisations.
 * Chaque ligne et chaque détail portent leur `organization`.
 */
/** GET /fleet/live — une ligne par véhicule, de la forme de `GET /vehicles/:id`. */
export interface LiveFleetResponse {
  data: VehicleDetail[];
  meta: { total: number; truncated: boolean; generatedAt: string };
}

export const vehicleService = {
  /**
   * GET /fleet/live?vehicleGroupId= — toute la flotte de l'organisation du
   * jeton, boîtier et dernière position compris, en UN appel (niveaux 2 et 3).
   * Pas d'équivalent `/admin` : la plateforme garde la liste + détails.
   */
  async live(params: { vehicleGroupId?: string } = {}): Promise<LiveFleetResponse> {
    const { data } = await api.get<LiveFleetResponse>("/fleet/live", { params });
    return data;
  },

  /** GET [/admin]/vehicles?organizationId=&search=&status=&page=&perPage= */
  async list(params: VehicleListParams = {}): Promise<Paginated<Vehicle>> {
    const { data } = await api.get<Paginated<Vehicle>>(scopedPath("/vehicles"), { params });
    return data;
  },

  /** GET [/admin]/vehicles/:id — inclut le boîtier monté et la dernière position. */
  async get(id: string): Promise<VehicleDetail> {
    const { data } = await api.get<ApiResponse<VehicleDetail>>(scopedPath(`/vehicles/${id}`));
    return data.data;
  },

  /** POST [/admin]/vehicles — `organizationId` obligatoire. */
  async create(payload: CreateVehiclePayload): Promise<Vehicle> {
    const { data } = await api.post<ApiResponse<Vehicle>>(scopedPath("/vehicles"), payload);
    return data.data;
  },

  /** PATCH [/admin]/vehicles/:id — ex. { speedLimitKph: 120 } */
  async update(id: string, payload: UpdateVehiclePayload): Promise<Vehicle> {
    const { data } = await api.patch<ApiResponse<Vehicle>>(scopedPath(`/vehicles/${id}`), payload);
    return data.data;
  },

  /** DELETE [/admin]/vehicles/:id — archivage logique. */
  async remove(id: string): Promise<void> {
    await api.delete(scopedPath(`/vehicles/${id}`));
  },
};
