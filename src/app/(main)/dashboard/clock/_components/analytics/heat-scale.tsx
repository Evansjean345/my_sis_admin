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

export function heatClass(level: number): string {
  return STEPS[Math.max(0, Math.min(HEAT_LEVELS, level))];
}

/**
 * Bornes hautes des 5 paliers et palier d'une valeur — UNE seule source pour
 * la couleur des cases et la légende, qui ne peuvent donc pas se contredire.
 *
 * `integer` : pour des comptages (coupures, véhicules), les bornes sont
 * entières (« ≤ 2 », jamais « ≤ 0,6 coupure »). Quand le maximum est petit,
 * plusieurs paliers partagent une borne : on retient le DERNIER palier qui la
 * porte (le maximum reste le plus foncé), et la légende n'affiche que les
 * bornes distinctes.
 */
export interface HeatScale {
  max: number;
  bounds: number[];
  level: (value: number) => number;
}

export function heatScale(max: number, integer = false): HeatScale {
  const bounds = Array.from({ length: HEAT_LEVELS }, (_, i) => {
    const b = (max * (i + 1)) / HEAT_LEVELS;
    return integer ? Math.ceil(b) : b;
  });
  return {
    max,
    bounds,
    level: (value) => {
      if (value <= 0 || max <= 0) return 0;
      const i = bounds.findIndex((b) => value <= b + 1e-9);
      if (i === -1) return HEAT_LEVELS;
      return bounds.lastIndexOf(bounds[i]) + 1;
    },
  };
}

/** Légende chiffrée : bornes distinctes des paliers, dans l'unité de la vue. */
export function HeatLegend({
  scale,
  format,
  unit,
  className,
}: {
  scale: HeatScale;
  format: (value: number) => string;
  unit: string;
  className?: string;
}) {
  const items = scale.bounds
    .map((bound, i) => ({ level: i + 1, bound }))
    .filter((it, i, all) => all[i + 1]?.bound !== it.bound);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs", className)}>
      <span>{unit}</span>
      <ul className="flex items-center gap-1" aria-label={`Échelle : ${unit}`}>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className={cn("size-3 rounded-sm border", heatClass(0))} />
          <span className="tabular-nums">0</span>
        </li>
        {scale.max > 0
          ? items.map((it) => (
              <li key={`palier-${it.level}`} className="flex items-center gap-1">
                <span aria-hidden="true" className={cn("size-3 rounded-sm", heatClass(it.level))} />
                <span className="tabular-nums">≤ {format(it.bound)}</span>
              </li>
            ))
          : null}
      </ul>
    </div>
  );
}
