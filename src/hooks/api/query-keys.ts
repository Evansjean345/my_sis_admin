import type { ActivityParams, AdminCommandListParams, AdminStatsParams } from "@/types/admin";
import type { AuditLogListParams } from "@/types/audit";
import type { DeviceListParams } from "@/types/device";
import type { DriverListParams } from "@/types/driver";
import type { GroupKind, GroupListParams } from "@/types/group";
import type { OrganizationListParams } from "@/types/organization";
import type { ScheduleListParams } from "@/types/schedule";
import type { UserListParams } from "@/types/user";
import type { VehicleListParams } from "@/types/vehicle";

/** Clés React Query centralisées : une invalidation = un préfixe. */
export const queryKeys = {
  /** Tableau de bord admin (/api/v1/admin/*) : invalider `admin.all` rafraîchit tous les compteurs. */
  admin: {
    all: ["admin"] as const,
    overview: ["admin", "overview"] as const,
    activity: (params: ActivityParams) => ["admin", "activity", params] as const,
    organizationsStats: ["admin", "organizations", "stats"] as const,
    usersStats: (params: AdminStatsParams) => ["admin", "users", "stats", params] as const,
    vehiclesStats: (params: AdminStatsParams) => ["admin", "vehicles", "stats", params] as const,
    devicesStats: (params: AdminStatsParams) => ["admin", "devices", "stats", params] as const,
    commandsStats: (params: AdminStatsParams) => ["admin", "commands", "stats", params] as const,
    commands: (params: AdminCommandListParams) => ["admin", "commands", "list", params] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
  roles: {
    all: ["roles"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: UserListParams) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    list: (params: VehicleListParams) => ["vehicles", "list", params] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
  },
  devices: {
    all: ["devices"] as const,
    list: (params: DeviceListParams) => ["devices", "list", params] as const,
    detail: (id: string) => ["devices", "detail", id] as const,
    diagnostic: (id: string) => ["devices", "diagnostic", id] as const,
    telemetry: (id: string) => ["devices", "telemetry", id] as const,
    logs: (id: string, count: number) => ["devices", "logs", id, count] as const,
  },
  commands: {
    all: (deviceId: string) => ["commands", deviceId] as const,
    history: (deviceId: string) => ["commands", deviceId, "history"] as const,
    catalog: (deviceId: string) => ["commands", deviceId, "catalog"] as const,
    flespiCatalog: (deviceId: string) => ["commands", deviceId, "flespi-catalog"] as const,
  },
  organizations: {
    all: ["organizations"] as const,
    list: (params: OrganizationListParams) => ["organizations", "list", params] as const,
    detail: (id: string) => ["organizations", "detail", id] as const,
    roles: (id: string) => ["organizations", "roles", id] as const,
    users: (id: string, params: UserListParams) => ["organizations", "users", id, params] as const,
  },
  /** Calendriers d'utilisation : invalider `schedules.all` rafraîchit aussi les états planifiés. */
  schedules: {
    all: ["schedules"] as const,
    list: (params: ScheduleListParams) => ["schedules", "list", params] as const,
    detail: (id: string) => ["schedules", "detail", id] as const,
    preview: (id: string, at: string | undefined) => ["schedules", "preview", id, at ?? "now"] as const,
    vehicleStatus: (vehicleId: string) => ["schedules", "vehicle-status", vehicleId] as const,
    ofGroup: (groupId: string) => ["schedules", "group", groupId] as const,
  },
  drivers: {
    all: ["drivers"] as const,
    list: (params: DriverListParams) => ["drivers", "list", params] as const,
    detail: (id: string) => ["drivers", "detail", id] as const,
    ofVehicle: (vehicleId: string) => ["drivers", "vehicle", vehicleId] as const,
  },
  /** Une seule entrée pour les trois familles : la clé porte le type de groupe. */
  groups: {
    all: (kind: GroupKind) => ["groups", kind] as const,
    list: (kind: GroupKind, params: GroupListParams) => ["groups", kind, "list", params] as const,
    detail: (kind: GroupKind, id: string) => ["groups", kind, "detail", id] as const,
    members: (kind: GroupKind, id: string) => ["groups", kind, "members", id] as const,
  },
  audit: {
    all: ["audit"] as const,
    list: (params: AuditLogListParams) => ["audit", "list", params] as const,
    actions: (params: Pick<AuditLogListParams, "from" | "to" | "organizationId">) =>
      ["audit", "actions", params] as const,
    organization: (id: string, params: AuditLogListParams) => ["audit", "organization", id, params] as const,
    group: (kind: GroupKind, id: string, params: AuditLogListParams) => ["audit", "group", kind, id, params] as const,
  },
  flespi: {
    all: ["flespi"] as const,
    health: ["flespi", "health"] as const,
    channels: ["flespi", "channels"] as const,
    connections: (id: number) => ["flespi", "channels", id, "connections"] as const,
    logs: (id: number, count: number) => ["flespi", "channels", id, "logs", count] as const,
    idents: (id: number) => ["flespi", "channels", id, "idents"] as const,
    deviceTypes: (protocol: string, search?: string) => ["flespi", "device-types", protocol, search ?? ""] as const,
  },
};
