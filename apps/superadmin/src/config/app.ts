import type { AccessLevel } from "@shared/lib/access/levels";

/**
 * Espace Super Admin — niveau 1.
 * Seuls les comptes de ce niveau peuvent ouvrir une session dans cette application.
 */
export const APP_LEVEL: AccessLevel = 1;

export const APP_META = {
  title: "SISBM CORE — Super Admin",
  description:
    "Exploitation de la plateforme SISBM CORE : organisations, trackers, canaux flespi et supervision globale.",
};
