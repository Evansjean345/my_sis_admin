import { cn } from "cn";

import { formatDayShort, formatWeekdayShort } from "./format";
import { HeatLegend, heatClass, heatScale } from "./heat-scale";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

/**
 * Semaine en carte de chaleur heure × jour. C'est un vrai `<table>` :
 * en-têtes de ligne et de colonne, valeur imprimée dans chaque case —
 * le lecteur d'écran le parcourt comme un tableau, sans graphique à décrire.
 */
export function WeekHeatmap({
  days,
  unit,
  format,
  integer = false,
  selected,
  onSelect,
}: {
  /** 7 jours, lundi → dimanche ; 24 valeurs par jour (23 ou 25 au changement d'heure). */
  days: Array<{ date: string; hours: number[] }>;
  /** « Véhicules immobilisés (moyenne sur l'heure) », « Commandes émises »… */
  unit: string;
  format: (value: number) => string;
  /** Comptage : légende à bornes entières. */
  integer?: boolean;
  selected: string;
  onSelect: (date: string) => void;
}) {
  // Les jours de changement d'heure ont 23 ou 25 heures : on aligne sur 24 colonnes.
  const grid = days.map((d) => HOURS.map((_, h) => d.hours[h] ?? 0));
  const scale = heatScale(Math.max(0, ...grid.flat()), integer);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[620px] border-separate border-spacing-0.5 text-[11px] tabular-nums">
          <caption className="sr-only">
            {unit}, du {formatDayShort(days[0].date)} au {formatDayShort(days[days.length - 1].date)}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-16 px-1 text-left font-normal text-muted-foreground">
                <span className="sr-only">Jour</span>
              </th>
              {HOURS.map((label) => (
                <th key={label} scope="col" className="px-0 font-normal text-muted-foreground">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d, row) => (
              <tr key={d.date}>
                <th scope="row" className="px-1 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => onSelect(d.date)}
                    aria-pressed={d.date === selected}
                    className={cn(
                      "flex min-h-7 w-full cursor-pointer items-center gap-1 rounded-sm px-1 text-left capitalize outline-none hover:bg-muted-foreground/10 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      d.date === selected && "font-semibold text-foreground",
                    )}
                  >
                    {formatWeekdayShort(d.date)}
                    <span className="text-muted-foreground">{Number(d.date.slice(8))}</span>
                  </button>
                </th>
                {HOURS.map((label, h) => {
                  const value = grid[row][h];
                  return (
                    <td
                      key={label}
                      title={`${label}h : ${format(value)} — ${unit.toLowerCase()}`}
                      className={cn("h-7 min-w-5 rounded-sm text-center", heatClass(scale.level(value)))}
                    >
                      {value > 0 ? (
                        format(value)
                      ) : (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="sr-only">0</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <HeatLegend scale={scale} format={format} unit={unit} />
    </div>
  );
}
