import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * =========================================================================
 *  PALETTE DES GRAPHIQUES DU TABLEAU DE BORD
 * =========================================================================
 *
 * Les jetons `--chart-*` du thème sont des gris (thème par défaut) : utiles
 * pour une série unique, inutilisables pour distinguer des séries. Les
 * couleurs ci-dessous viennent d'une palette validée pour le daltonisme
 * (ΔE ≥ 9 entre les trois premières teintes, en clair comme en sombre) :
 *
 *  - SÉRIES (identité)  : bleu, orange, vert d'eau — dans cet ordre, jamais
 *    réaffecté selon le classement ;
 *  - STATUTS (état)     : bon / attention / critique / neutre — réservés aux
 *    états, toujours accompagnés d'un libellé.
 *
 * Chaque paire `light/dark` est consommée par `ChartContainer` (shadcn), qui
 * publie `--color-<clé>` pour le thème actif.
 */
export const SERIES = {
  blue: { light: "#2a78d6", dark: "#3987e5" },
  orange: { light: "#eb6834", dark: "#d95926" },
  aqua: { light: "#1baf7a", dark: "#199e70" },
} as const;

export const STATUS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#fab219", dark: "#fab219" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
  neutral: { light: "#b3b1a8", dark: "#6b6a65" },
} as const;

/** Lignes de grille et axes : un cran au-dessus de la surface, jamais pointillés. */
export const GRID_PROPS = { vertical: false, stroke: "var(--border)", strokeDasharray: undefined } as const;
export const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });
const plain = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 1 284 → « 1,3 k » pour les axes et les tuiles. */
export const formatCompact = (value: number) =>
  Math.abs(value) >= 10_000 ? compact.format(value) : plain.format(value);

/** « 2026-09-14 » → « 14 sept. » */
export const formatDay = (date: string) => format(parseISO(date), "d MMM", { locale: fr });

/** « 2026-09-14 » → « lundi 14 septembre » */
export const formatDayLong = (date: string) => format(parseISO(date), "EEEE d MMMM", { locale: fr });

/**
 * Variation entre la seconde moitié de la fenêtre et la première
 * (ex. 30 jours → 15 derniers vs 15 précédents). `null` si la base est nulle.
 */
export function halfDelta(values: number[]): number | null {
  if (values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
  const before = sum(values.slice(0, mid));
  const after = sum(values.slice(values.length - mid));
  if (before === 0) return null;
  return ((after - before) / before) * 100;
}
