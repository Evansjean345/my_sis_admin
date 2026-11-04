import type { StatusTone } from "@/components/status-badge";
import type { CommandStatus } from "@/types/command";
import type { DeviceStatus } from "@/types/device";
import type { UserStatus } from "@/types/user";
import type { ConnectionState, VehicleStatus, VehicleType } from "@/types/vehicle";

type Meta = { label: string; tone: StatusTone };

export const userStatusMeta: Record<UserStatus, Meta> = {
  active: { label: "Actif", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  suspended: { label: "Suspendu", tone: "orange" },
};

export const deviceStatusMeta: Record<DeviceStatus, Meta> = {
  stock: { label: "En stock", tone: "info" },
  active: { label: "Actif", tone: "success" },
  maintenance: { label: "Maintenance", tone: "warning" },
  decommissioned: { label: "Retiré", tone: "neutral" },
};

export const vehicleStatusMeta: Record<VehicleStatus, Meta> = {
  draft: { label: "Brouillon", tone: "neutral" },
  active: { label: "Actif", tone: "success" },
  maintenance: { label: "Maintenance", tone: "warning" },
  inactive: { label: "Inactif", tone: "orange" },
  archived: { label: "Archivé", tone: "neutral" },
};

export const vehicleTypeLabels: Record<VehicleType, string> = {
  car: "Voiture",
  van: "Fourgon",
  truck: "Camion",
  tanker: "Citerne",
  bus: "Bus",
  motorcycle: "Moto",
  trailer: "Remorque",
  machinery: "Engin",
  other: "Autre",
};

const commandStatusMap: Record<string, Meta> = {
  approved: { label: "Acceptée", tone: "info" },
  queued: { label: "En file", tone: "info" },
  sent: { label: "Envoyée", tone: "info" },
  acknowledged: { label: "Acquittée", tone: "success" },
  failed: { label: "Échec", tone: "danger" },
  expired: { label: "Expirée", tone: "neutral" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export function commandStatusMeta(status: CommandStatus): Meta {
  return commandStatusMap[status] ?? { label: status, tone: "neutral" };
}

const commandTypeMap: Record<string, string> = {
  engine_cut: "Coupure carburant",
  engine_restore: "Rétablissement carburant",
  locate: "Localisation",
  reboot: "Redémarrage",
  set_interval: "Intervalle de suivi",
  custom: "Commande personnalisée",
};

export function commandTypeLabel(type: string): string {
  return commandTypeMap[type] ?? type;
}

export function connectionStateMeta(state: ConnectionState | null | undefined): Meta {
  if (state === "online") return { label: "En ligne", tone: "success" };
  if (state === "offline") return { label: "Hors ligne", tone: "danger" };
  if (state === "stale") return { label: "Données anciennes", tone: "warning" };
  return { label: state ?? "Inconnu", tone: "neutral" };
}

export const PERMISSION_LABELS: Record<string, string> = {
  "*": "Accès total",
  vehicle: "Véhicules",
  device: "Trackers",
  user: "Utilisateurs",
  geofence: "Géofences",
  policy: "Politiques",
  alert: "Alertes",
  incident: "Incidents",
  report: "Rapports",
  command: "Commandes",
  audit: "Journal d'audit",
};

export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  "*": "tout",
  read: "lecture",
  write: "écriture",
  immobilize: "coupure / rétablissement moteur",
  sensitive: "commandes sensibles",
};

export function permissionLabel(permission: string): string {
  if (permission === "*") return PERMISSION_LABELS["*"];
  const [resource, action] = permission.split(":");
  const r = PERMISSION_LABELS[resource] ?? resource;
  const a = PERMISSION_ACTION_LABELS[action] ?? action;
  return `${r} · ${a}`;
}
