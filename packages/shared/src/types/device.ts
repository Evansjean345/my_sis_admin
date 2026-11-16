import type { OrganizationSummary } from "@shared/types/admin";
import type { PaginationParams } from "@shared/types/api";

export const DEVICE_STATUSES = ["stock", "active", "maintenance", "decommissioned"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_MANUFACTURERS = ["micodus", "teltonika", "concox", "queclink", "other"] as const;
export type DeviceManufacturer = (typeof DEVICE_MANUFACTURERS)[number];

export interface Device {
  id: string;
  imei: string;
  serialNumber: string | null;
  manufacturer: DeviceManufacturer | (string & {});
  model: string;
  protocol: string | null;
  firmwareVersion?: string | null;
  hasRelay: boolean;
  simMsisdn: string | null;
  simIccid: string | null;
  simOperator: string | null;
  organizationId: string;
  flespiDeviceId: number | null;
  flespiChannelId: number | null;
  flespiIdent: string | null;
  status: DeviceStatus;
  lastSeenAt?: string | null;
  lastGsmSignal?: number | null;
  lastBatteryPct?: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Organisation propriétaire — ajoutée par les listes et détails `/admin/*`. */
  organization?: OrganizationSummary | null;
}

/** Affectation en cours (GET /devices/:id) — colonnes SQL brutes, donc snake_case. */
export interface DeviceAssignment {
  id: string;
  registration: string;
  installed_at: string;
}

export interface DeviceDetail extends Device {
  assignment: DeviceAssignment | null;
}

export interface DeviceListParams extends PaginationParams {
  status?: DeviceStatus;
  /** 3 caractères minimum côté API. */
  search?: string;
  unassigned?: boolean;
  /** Filtre admin : une seule organisation. */
  organizationId?: string;
  /** true : rattachés à flespi · false : jamais synchronisés. */
  linked?: boolean;
}

export interface CreateDevicePayload {
  /** Organisation propriétaire — exigée par les créations `POST /admin/*`. */
  organizationId: string;
  imei: string;
  terminalId?: string;
  model: string;
  name?: string;
  manufacturer?: DeviceManufacturer;
  serialNumber?: string;
  hasRelay?: boolean;
  simMsisdn?: string;
  simIccid?: string;
  simOperator?: string;
  status?: DeviceStatus;
  notes?: string;
  syncFlespi?: boolean;
  flespiChannelId?: number;
  flespiDeviceType?: string;
  flespiIdent?: string;
  linkExisting?: boolean;
}

export interface CreateDeviceMeta {
  flespi?: {
    deviceId: number;
    ident: string;
    deviceType: string;
    protocol: string;
    created: boolean;
  };
}

export interface UpdateDevicePayload {
  serialNumber?: string;
  model?: string;
  hasRelay?: boolean;
  simMsisdn?: string;
  simOperator?: string;
  status?: DeviceStatus;
  notes?: string;
  flespiIdent?: string;
  name?: string;
}

export interface SyncDeviceFlespiPayload {
  flespiChannelId?: number;
  flespiIdent?: string;
  terminalId?: string;
  name?: string;
  flespiDeviceType?: string;
  linkExisting?: boolean;
}

export interface AssignDevicePayload {
  vehicleId: string;
  installNotes?: string;
}

/** GET /devices/:id/flespi — diagnostic complet. */
export interface DeviceDiagnostic {
  linked: boolean;
  device?: {
    id: number;
    name: string;
    ident: string;
    phone: string | null;
    enabled: boolean;
    deviceTypeId: number;
    deviceType: string | null;
    protocolId: number;
    messagesTtl: number;
  };
  channel?: { id: number; uri: string; protocolId: number } | null;
  lastMessageAt?: string | null;
  position?: {
    latitude: number | null;
    longitude: number | null;
    speed: number | null;
    valid: boolean | null;
    satellites: number | null;
  };
  ignition?: boolean | null;
  batteryLevel?: number | null;
  gsmSignal?: number | null;
  problems: string[];
}

/** GET /devices/:id/flespi/telemetry — dernière valeur de chaque paramètre. */
export type TelemetryValue = string | number | boolean | null | Record<string, unknown>;
export type DeviceTelemetry = Record<string, { ts: number; value: TelemetryValue }>;

/** GET /devices/:id/flespi/logs — événements flespi (forme ouverte). */
export interface FlespiLogEntry {
  id?: number;
  event_code: number;
  timestamp: number;
  origin_type?: number;
  transport?: string;
  source?: string;
  host?: string;
  name?: string;
  executed?: boolean;
  response?: string;
  error_text?: string;
  close_code?: number;
  duration?: number;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LogQueryParams {
  from?: string;
  to?: string;
  count?: number;
}
