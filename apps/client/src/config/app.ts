import type { AccessLevel } from "@shared/lib/access/levels";

/**
 * Espace Client — niveau 3.
 * Seuls les comptes de ce niveau peuvent ouvrir une session dans cette application.
 */
export const APP_LEVEL: AccessLevel = 3;

export const APP_META = {
  title: "SISBM CORE — Client",
  description: "Suivi en temps réel de vos véhicules et sécurité de votre flotte.",
};
