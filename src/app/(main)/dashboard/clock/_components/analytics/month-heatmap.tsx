"use client";

import { type KeyboardEvent, useRef } from "react";

import { cn } from "cn";

import { formatDayLong } from "./format";
import { HeatLegend, heatClass, heatLevel } from "./heat-scale";
import type { DayCell } from "./metrics";

const WEEK_HEADERS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];
const WEEK_STARTS = [0, 7, 14, 21, 28, 35];

/**
 * Calendrier du mois en carte de chaleur : 6 semaines de 7 jours (lundi en
 * premier), valeur imprimée dans chaque case. Navigation au clavier :
 * flèches (± 1 jour, ± 1 semaine), Début / Fin de semaine. Un seul arrêt de tabulation
 * (le jour sélectionné) : la grille ne pèse pas 42 tabulations.
 */
export function MonthHeatmap({
  days,
  month,
  meta,
  selected,
  today,
  onSelect,
}: {
  /** 42 cases, du lundi précédant le 1er au dimanche de la 6e semaine. */
  days: DayCell[];
  /** « 2026-11 » : les jours hors du mois sont estompés. */
  month: string;
  meta: { unit: string; format: (value: number) => string };
  selected: string;
  today: string;
  onSelect: (date: string) => void;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const inMonth = days.filter((d) => d.date.startsWith(month));
  const max = Math.max(0, ...inMonth.map((d) => d.value));

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -(index % 7),
      End: 6 - (index % 7),
    };
    const delta = moves[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(days.length - 1, index + delta));
    onSelect(days[next].date);
    refs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      <table className="w-full table-fixed border-separate border-spacing-1">
        <caption className="sr-only">
          Calendrier du mois : {meta.unit.toLowerCase()}. Flèches pour changer de jour.
        </caption>
        <thead>
          <tr>
            {WEEK_HEADERS.map((h) => (
              <th key={h} scope="col" className="px-1 text-left font-normal text-muted-foreground text-xs">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEK_STARTS.slice(0, days.length / 7).map((start) => (
            <tr key={days[start].date}>
              {days.slice(start, start + 7).map((d, i) => {
                const index = start + i;
                const value = d.value;
                const outside = !d.date.startsWith(month);
                const isSelected = d.date === selected;
                const isToday = d.date === today;
                return (
                  <td key={d.date} className="p-0">
                    <button
                      ref={(el) => {
                        refs.current[index] = el;
                      }}
                      type="button"
                      tabIndex={isSelected ? 0 : -1}
                      aria-pressed={isSelected}
                      onClick={() => onSelect(d.date)}
                      onKeyDown={(e) => onKeyDown(e, index)}
                      aria-label={`${formatDayLong(d.date)}${isToday ? " (aujourd'hui)" : ""}${outside ? " (hors du mois)" : ""} : ${meta.format(value)} — ${meta.unit.toLowerCase()}`}
                      className={cn(
                        "flex h-14 w-full cursor-pointer flex-col justify-between rounded-md p-1.5 text-left transition-shadow duration-150 sm:h-20 sm:p-2",
                        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        // Hors du mois : fond neutre plutôt qu'une opacité, pour garder le contraste du texte.
                        outside ? cn(heatClass(0), "border border-dashed") : heatClass(heatLevel(value, max)),
                        isSelected && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
                      )}
                    >
                      <span
                        className={cn(
                          "self-start text-xs tabular-nums",
                          isToday && "rounded-full bg-foreground px-1.5 font-semibold text-background",
                        )}
                      >
                        {Number(d.date.slice(8))}
                      </span>
                      <span className="truncate font-medium text-xs tabular-nums sm:text-sm">
                        {value > 0 ? meta.format(value) : "—"}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <HeatLegend max={max} format={meta.format} unit={meta.unit} />
    </div>
  );
}
