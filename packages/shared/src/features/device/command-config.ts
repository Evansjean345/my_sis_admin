import type { LucideIcon } from "lucide-react";
import { BellOff, BellRing, Crosshair, Gauge, GaugeCircle, MapPinned, Power, RotateCcw, Siren } from "lucide-react";

import type { BusinessCommandSlug } from "@shared/types/command";

export interface BusinessCommandConfig {
  slug: BusinessCommandSlug;
  /** Nom côté API (catalogue GET /devices/:id/commands). */
  apiName: string;
  label: string;
  description: string;
  code: string;
  icon: LucideIcon;
  group: "diagnostic" | "tracking" | "alarm" | "output" | "config" | "geofence";
  /** Paramètre `data` fixé par l'interface (ex. sortie ON/OFF). */
  presetData?: string;
  requiresData?: boolean;
  dataLabel?: string;
  dataPlaceholder?: string;
  dataHint?: string;
  warning?: string;
  /**
   * Visibilité dans le dashboard. Désactivées suite à la recette Jalon 2 :
   * set-admin-number / change-password (retirées), reset-password / set-apn / reboot
   * (à valider avec l'équipe), géofences (Phase 2).
   */
  enabled: boolean;
}

export const BUSINESS_COMMANDS: BusinessCommandConfig[] = [
  {
    slug: "request-status",
    apiName: "request_status",
    label: "Demander un rapport d'état",
    description: "Force le boîtier à émettre sa position et son état.",
    code: "R1",
    icon: Crosshair,
    group: "diagnostic",
    enabled: true,
  },
  {
    slug: "start-tracking",
    apiName: "start_tracking",
    label: "Activer le suivi renforcé",
    description: "Envoi fréquent de positions (convoi, surveillance).",
    code: "T1 1",
    icon: Gauge,
    group: "tracking",
    enabled: true,
  },
  {
    slug: "stop-tracking",
    apiName: "stop_tracking",
    label: "Revenir au rythme normal",
    description: "Désactive le suivi renforcé.",
    code: "T1 0",
    icon: GaugeCircle,
    group: "tracking",
    enabled: true,
  },
  {
    slug: "arm",
    apiName: "arm",
    label: "Armer l'alarme",
    description: "Détection de vibration et de remorquage.",
    code: "S10 1",
    icon: BellRing,
    group: "alarm",
    warning: "Commande sensible : l'alarme embarquée peut se déclencher sur le véhicule.",
    enabled: true,
  },
  {
    slug: "disarm",
    apiName: "disarm",
    label: "Désarmer l'alarme",
    description: "Désactive l'alarme embarquée.",
    code: "S10 0",
    icon: BellOff,
    group: "alarm",
    enabled: true,
  },
  {
    slug: "set-output",
    apiName: "set_output",
    label: "Activer la sortie 1",
    description: "Sirène / buzzer branché sur la sortie auxiliaire.",
    code: "S11 0,1",
    icon: Siren,
    group: "output",
    presetData: "0,1",
    warning: "Commande sensible : active un équipement physique sur le véhicule.",
    enabled: true,
  },
  {
    slug: "set-output",
    apiName: "set_output",
    label: "Désactiver la sortie 1",
    description: "Coupe la sirène / le buzzer.",
    code: "S11 0,0",
    icon: Power,
    group: "output",
    presetData: "0,0",
    enabled: true,
  },
  {
    slug: "reboot",
    apiName: "reboot",
    label: "Redémarrer le boîtier",
    description: "Le boîtier se reconnecte après quelques secondes.",
    code: "R2",
    icon: RotateCcw,
    group: "diagnostic",
    warning: "Le boîtier sera injoignable pendant son redémarrage.",
    enabled: false,
  },
  {
    slug: "set-apn",
    apiName: "set_apn",
    label: "Configurer l'APN",
    description: "apn,utilisateur,mot de passe",
    code: "C1",
    icon: Power,
    group: "config",
    requiresData: true,
    dataLabel: "APN",
    dataPlaceholder: "orange.ci,orange,orange",
    warning: "Une valeur erronée rend le boîtier INJOIGNABLE à distance.",
    enabled: false,
  },
  {
    slug: "add-geofence",
    apiName: "add_geofence",
    label: "Ajouter une géofence embarquée",
    description: "id,type,lat,lng,rayon_m",
    code: "G1",
    icon: MapPinned,
    group: "geofence",
    requiresData: true,
    dataLabel: "Géofence",
    dataPlaceholder: "1,1,5.359952,-4.008256,500",
    enabled: false,
  },
];

export const ENABLED_COMMANDS = BUSINESS_COMMANDS.filter((c) => c.enabled);

export const COMMAND_GROUP_LABELS: Record<BusinessCommandConfig["group"], string> = {
  diagnostic: "Diagnostic",
  tracking: "Suivi",
  alarm: "Alarme embarquée",
  output: "Sortie auxiliaire",
  config: "Configuration",
  geofence: "Géofences",
};

/** Réglages flespi pouvant rompre le lien boîtier ↔ flespi : confirmation exigée par l'API. */
export const CRITICAL_RAW_COMMANDS = new Set(["setting.server.set", "setting.network.set", "setting.auto_apn.set"]);

/** Libellés des principaux événements flespi (journal device / canal). */
export function flespiEventLabel(code: number): string {
  switch (code) {
    case 102:
      return "Connexion fermée";
    case 330:
      return "Commande mise en file";
    case 332:
      return "Résultat de commande";
    case 334:
      return "Commande transmise";
    default:
      return `Événement ${code}`;
  }
}
