export interface FlespiChannel {
  id: number;
  cid: number;
  name: string;
  enabled: boolean;
  protocol_id: number;
  messages_ttl: number;
  uri: string;
  secondary_uri: string;
  configuration: Record<string, unknown> | null;
}

export interface CreateChannelPayload {
  name: string;
  protocolName?: string;
  protocolId?: number;
  messagesTtl?: number;
  enabled?: boolean;
}

export interface UpdateChannelPayload {
  name?: string;
  messagesTtl?: number;
  enabled?: boolean;
}

export interface CreateChannelMeta {
  nextSteps: string[];
}

export interface FlespiConnection {
  id: number;
  connection_id: number;
  channel_id: number;
  ip: string;
  source: string;
  established: number;
  secondary: boolean;
  device_id: number | null;
  ident: string | null;
  transport: string;
  meta: unknown;
}

export interface FlespiProtocol {
  id: number;
  name: string;
  title?: string;
}

export interface FlespiDeviceType {
  id: number;
  name: string;
  title: string;
  protocol_id: number;
}

export interface FlespiDeviceTypesResponse {
  protocol: FlespiProtocol;
  deviceTypes: FlespiDeviceType[];
}

export interface FlespiHealth {
  api: { ok: boolean; [key: string]: unknown };
  configuredChannelId: number | null;
  channel: FlespiChannel | null;
  protocolName: string;
  deviceType: string;
  mqtt: {
    host: string;
    port: number;
    topics: string[];
    dedicatedToken: boolean;
  };
}

export type SeenIdentStatus = "registered" | "flespi_only" | "unregistered";

export interface SeenIdent {
  ident: string;
  lastSeen: number | null;
  lastSeenAt: string | null;
  source: "messages" | "connection" | (string & {});
  sisbmDeviceId: string | null;
  flespiDeviceId: number | null;
  flespiDeviceTypeId: number | null;
  status: SeenIdentStatus;
}
