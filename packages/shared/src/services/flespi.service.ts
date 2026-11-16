import { api } from "@shared/lib/axios";
import type { ApiResponse } from "@shared/types/api";
import type { FlespiLogEntry, LogQueryParams } from "@shared/types/device";
import type {
  CreateChannelMeta,
  CreateChannelPayload,
  FlespiChannel,
  FlespiConnection,
  FlespiDeviceTypesResponse,
  FlespiHealth,
  FlespiProtocol,
  SeenIdent,
  UpdateChannelPayload,
} from "@shared/types/flespi";

export const flespiService = {
  /** GET /flespi/health — jeton, canal configuré, broker MQTT. */
  async health(): Promise<FlespiHealth> {
    const { data } = await api.get<ApiResponse<FlespiHealth>>("/flespi/health");
    return data.data;
  },

  /** GET /flespi/protocols?search= */
  async protocols(search?: string): Promise<FlespiProtocol[]> {
    const { data } = await api.get<ApiResponse<FlespiProtocol[]>>("/flespi/protocols", {
      params: search ? { search } : undefined,
    });
    return data.data;
  },

  /** GET /flespi/protocols/:protocol/device-types?search= */
  async deviceTypes(protocol: string, search?: string): Promise<FlespiDeviceTypesResponse> {
    const { data } = await api.get<ApiResponse<FlespiDeviceTypesResponse>>(
      `/flespi/protocols/${encodeURIComponent(protocol)}/device-types`,
      { params: search ? { search } : undefined },
    );
    return data.data;
  },

  /** GET /flespi/channels */
  async listChannels(): Promise<FlespiChannel[]> {
    const { data } = await api.get<ApiResponse<FlespiChannel[]>>("/flespi/channels");
    return data.data;
  },

  /** GET /flespi/channels/:id */
  async getChannel(id: number): Promise<FlespiChannel> {
    const { data } = await api.get<ApiResponse<FlespiChannel>>(`/flespi/channels/${id}`);
    return data.data;
  },

  /** POST /flespi/channels */
  async createChannel(payload: CreateChannelPayload): Promise<ApiResponse<FlespiChannel, CreateChannelMeta>> {
    const { data } = await api.post<ApiResponse<FlespiChannel, CreateChannelMeta>>("/flespi/channels", payload);
    return data;
  },

  /** PATCH /flespi/channels/:id */
  async updateChannel(id: number, payload: UpdateChannelPayload): Promise<FlespiChannel> {
    const { data } = await api.patch<ApiResponse<FlespiChannel>>(`/flespi/channels/${id}`, payload);
    return data.data;
  },

  /** DELETE /flespi/channels/:id — refusé (409) pour le canal de production. */
  async deleteChannel(id: number): Promise<void> {
    await api.delete(`/flespi/channels/${id}`);
  },

  /** GET /flespi/channels/:id/logs?count= */
  async channelLogs(id: number, params: LogQueryParams = { count: 50 }): Promise<FlespiLogEntry[]> {
    const { data } = await api.get<ApiResponse<FlespiLogEntry[]>>(`/flespi/channels/${id}/logs`, { params });
    return data.data;
  },

  /** GET /flespi/channels/:id/connections — connexions TCP actives. */
  async channelConnections(id: number): Promise<FlespiConnection[]> {
    const { data } = await api.get<ApiResponse<FlespiConnection[]>>(`/flespi/channels/${id}/connections`);
    return data.data;
  },

  /** GET /flespi/channels/:id/idents — idents vus sur le canal, croisés avec SISBM et flespi. */
  async channelIdents(id: number): Promise<SeenIdent[]> {
    const { data } = await api.get<ApiResponse<SeenIdent[]>>(`/flespi/channels/${id}/idents`);
    return data.data;
  },
};
