import { cn } from "cn";

import { DAY_LABELS, type ScheduleMode, type ScheduleWindow, WEEK_ORDER } from "@/types/schedule";

import { endMinutes, toMinutes } from "./week-utils";

const DAY_MINUTES = 24 * 60;
const HOUR_MARKS = [0, 6, 12, 18, 24];

/**
 * Semaine type en barres horaires : une ligne par jour, une barre par plage.
 *
 * Un calendrier n'a pas de mode en soi : c'est le RATTACHEMENT qui dit si
 * ses plages autorisent ou interdisent. Sans mode, l'aperçu est neutre ;
 * avec un mode, la couleur dit ce que la plage signifie pour le véhicule :
 *   - `allowed`   : plage verte = le véhicule peut rouler ;
 *   - `forbidden` : plage rouge = le véhicule est immobilisé.
 */
export function WeekPreview({
  windows,
  mode = "neutral",
  compact = false,
  className,
}: {
  windows: Array<Pick<ScheduleWindow, "dayOfWeek" | "startTime" | "endTime">>;
  mode?: ScheduleMode | "neutral";
  compact?: boolean;
  className?: string;
}) {
  const barClass =
    mode === "forbidden" ? "bg-destructive/70" : mode === "allowed" ? "bg-emerald-500/80" : "bg-primary/70";

  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5", className)}>
      {WEEK_ORDER.map((day) => {
        const plages = windows.filter((w) => w.dayOfWeek === day);
        return (
          <div key={day} className="flex items-center gap-2">
            <span
              className={cn(
                "shrink-0 text-muted-foreground tabular-nums",
                compact ? "w-7 text-[10px]" : "w-20 text-xs",
              )}
            >
              {compact ? DAY_LABELS[day].slice(0, 2) : DAY_LABELS[day]}
            </span>
            <div
              className={cn(
                "relative flex-1 overflow-hidden rounded-sm bg-muted-foreground/10",
                compact ? "h-1.5" : "h-4",
              )}
              role="img"
              aria-label={`${DAY_LABELS[day]} : ${
                plages.length === 0
                  ? "aucune plage"
                  : plages.map((w) => `${w.startTime.slice(0, 5)} à ${w.endTime.slice(0, 5)}`).join(", ")
              }`}
            >
              {plages.map((w) => {
                const start = toMinutes(w.startTime) ?? 0;
                const end = endMinutes(w.endTime) ?? 0;
                return (
                  <span
                    key={`${w.startTime}-${w.endTime}`}
                    className={cn("absolute inset-y-0 rounded-[2px]", barClass)}
                    style={{
                      left: `${(start / DAY_MINUTES) * 100}%`,
                      width: `${((end - start) / DAY_MINUTES) * 100}%`,
                    }}
                    title={`${w.startTime.slice(0, 5)} – ${w.endTime.slice(0, 5)}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {compact ? null : (
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0" />
          <div className="relative h-4 flex-1 text-[10px] text-muted-foreground tabular-nums">
            {HOUR_MARKS.map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {String(h).padStart(2, "0")}h
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
