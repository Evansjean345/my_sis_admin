import type { OrganizationSummary } from "@shared/types/admin";
import type { PaginationParams } from "@shared/types/api";

export const VEHICLE_TYPES = [
  "car",
  "van",
  "truck",
  "tanker",
  "bus",
  "motorcycle",
  "trailer",
  "machinery",
  "other",
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = ["draft", "active", "maintenance", "inactive", "archived"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export interface Vehicle {
  id: string;
  organizationId: string;
  registration: string;
  vin: string | null;
  label: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  vehicleType: VehicleType;
  color: string | null;
  status: VehicleStatus;
  /** Décimal sérialisé en chaîne par PostgreSQL (« 12500.00 »), nombre après création. */
  odometerKm: string | number;
  speedLimitKph: string | number;
  immobilizationEnabled: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Organisation propriétaire — ajoutée par les listes et détails `/admin/*`. */
  organization?: OrganizationSummary | null;
}

export type ConnectionState = "online" | "offline" | "stale" | (string & {});

export interface VehicleDetail extends Vehicle {
  device: {
    id: string;
    imei: string;
    model: string;
    hasRelay: boolean;
  } | null;
  lastPosition: {
    latitude: number;
    longitude: number;
    speedKph: string | number;
    ignition: boolean | null;
    recordedAt: string;
    connectionState: ConnectionState;
  } | null;
}

export interface VehicleListParams extends PaginationParams {
  /** Filtre admin : une seule organisation. */
  organizationId?: string;
  search?: string;
  status?: VehicleStatus;
}

export interface CreateVehiclePayload {
  /** Organisation propriétaire — exigée par les créations `POST /admin/*`. */
  organizationId: string;
  registration: string;
  vin?: string;
  label?: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType?: VehicleType;
  color?: string;
  status?: VehicleStatus;
  odometerKm?: number;
  speedLimitKph?: number;
  immobilizationEnabled?: boolean;
  notes?: string;
}

export type UpdateVehiclePayload = Partial<Omit<CreateVehiclePayload, "vin">>;
