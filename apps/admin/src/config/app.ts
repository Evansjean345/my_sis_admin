import type { AccessLevel } from "@shared/lib/access/levels";

/**
 * Espace Administration — niveau 2.
 * Seuls les comptes de ce niveau peuvent ouvrir une session dans cette application.
 */
export const APP_LEVEL: AccessLevel = 2;

export const APP_META = {
  title: "SISBM CORE — Administration",
  description: "Administration de votre organisation : véhicules, flottes, trackers, conducteurs et utilisateurs.",
};
