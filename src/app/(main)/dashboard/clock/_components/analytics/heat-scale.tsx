import { cn } from "cn";

/**
 * Échelle séquentielle à 5 paliers (bleu, une seule teinte) pour les cartes
 * de chaleur. Chaque palier porte sa couleur de texte : contraste ≥ 4,7:1
 * vérifié en clair comme en sombre, la valeur reste donc imprimée dans la
 * cellule — la couleur ne porte jamais l'information seule.
 *
 * Classes écrites en entier : Tailwind ne génère que ce qu'il lit.
 */
const STEPS = [
  "bg-muted-foreground/5 text-muted-foreground",
  "bg-[#eaf2fc] text-[#1a2332] dark:bg-[#172a40] dark:text-[#f5f5f5]",
  "bg-[#c7ddf7] text-[#1a2332] dark:bg-[#1d416b] dark:text-[#f5f5f5]",
  "bg-[#93bdee] text-[#1a2332] dark:bg-[#255d9a] dark:text-[#f5f5f5]",
  "bg-[#4c8fdc] text-[#1a2332] dark:bg-[#3b82d1] dark:text-[#0a0a0a]",
  "bg-[#1f5fae] text-white dark:bg-[#8cc0f5] dark:text-[#0a0a0a]",
] as const;

export const HEAT_LEVELS = STEPS.length - 1;

/** Clés stables des paliers : les bornes se confondent quand la vue est toute à zéro. */
const LEVEL_KEYS = ["p1", "p2", "p3", "p4", "p5"] as const;

/** Palier 0 (rien) à 5 (maximum de la vue). */
export function heatLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(HEAT_LEVELS, Math.max(1, Math.ceil((value / max) * HEAT_LEVELS)));
}

export function heatClass(level: number): string {
  return STEPS[Math.max(0, Math.min(HEAT_LEVELS, level))];
}

/** Légende chiffrée : bornes de chaque palier dans l'unité de la vue. */
export function HeatLegend({
  max,
  format,
  unit,
  className,
}: {
  max: number;
  format: (value: number) => string;
  unit: string;
  className?: string;
}) {
  const bounds = LEVEL_KEYS.map((key, i) => ({ key, value: (max * (i + 1)) / HEAT_LEVELS }));
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs", className)}>
      <span>{unit}</span>
      <ul className="flex items-center gap-1" aria-label={`Échelle : ${unit}`}>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className={cn("size-3 rounded-sm border", heatClass(0))} />
          <span className="tabular-nums">0</span>
        </li>
        {max > 0
          ? bounds.map((b, i) => (
              <li key={b.key} className="flex items-center gap-1">
                <span aria-hidden="true" className={cn("size-3 rounded-sm", heatClass(i + 1))} />
                <span className="tabular-nums">≤ {format(b.value)}</span>
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}
