import { DAY_LABELS, type ScheduleWindow } from "@/types/schedule";

/**
 * Outils de la semaine type — miroir des règles du domaine back-end
 * (`domain/scheduling/value_objects.ts`), pour signaler une erreur AVANT
 * l'envoi. L'API reste juge : elle renvoie les mêmes refus en 422.
 *
 *   - jour 0 (dimanche) … 6 (samedi) ;
 *   - fin EXCLUE, strictement après le début ;
 *   - `24:00` = fin de journée. Un champ `<input type="time">` ne sait pas
 *     l'écrire : une fin saisie à `00:00` est donc lue comme minuit (24:00) ;
 *   - une plage qui passe minuit se saisit en deux fenêtres ;
 *   - deux plages du même jour ne se chevauchent pas.
 */

export type DraftWindow = Omit<ScheduleWindow, "id">;

const TIME = /^([01]\d|2[0-4]):([0-5]\d)$/;

export function toMinutes(value: string): number | null {
  const m = TIME.exec(value.slice(0, 5));
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes > 24 * 60 ? null : minutes;
}

/** Fin de plage : `00:00` saisi = minuit, fin de journée. */
export function endMinutes(value: string): number | null {
  const m = toMinutes(value);
  return m === 0 ? 24 * 60 : m;
}

/** Valeur affichable dans un `<input type="time">` (24:00 → 00:00). */
export function toTimeInput(value: string): string {
  const hhmm = value.slice(0, 5);
  return hhmm === "24:00" ? "00:00" : hhmm;
}

/** Valeur envoyée à l'API : fin à 00:00 → 24:00. */
export function normalizeWindows(windows: DraftWindow[]): DraftWindow[] {
  return windows
    .map((w) => ({
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime.slice(0, 5),
      endTime: endMinutes(w.endTime) === 24 * 60 ? "24:00" : w.endTime.slice(0, 5),
    }))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
}

/** Première erreur rencontrée, ou `null`. */
export function validateWindows(windows: DraftWindow[]): string | null {
  for (const w of windows) {
    const start = toMinutes(w.startTime);
    const end = endMinutes(w.endTime);
    if (start === null || end === null) return `${DAY_LABELS[w.dayOfWeek]} : heure illisible.`;
    if (start >= end) {
      return `${DAY_LABELS[w.dayOfWeek]} : la fin doit suivre le début. Une plage qui passe minuit se saisit en deux (22:00 → 00:00 puis 00:00 → 06:00 le lendemain).`;
    }
  }
  const sorted = normalizeWindows(windows);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (a.dayOfWeek === b.dayOfWeek && (toMinutes(b.startTime) ?? 0) < (endMinutes(a.endTime) ?? 0)) {
      return `${DAY_LABELS[a.dayOfWeek]} : deux plages se chevauchent (${a.startTime}–${a.endTime} et ${b.startTime}–${b.endTime}).`;
    }
  }
  return null;
}

/** Durée hebdomadaire couverte, en heures. */
export function weeklyHours(windows: Array<Pick<ScheduleWindow, "startTime" | "endTime">>): number {
  const minutes = windows.reduce((sum, w) => {
    const start = toMinutes(w.startTime) ?? 0;
    const end = endMinutes(w.endTime) ?? 0;
    return sum + Math.max(0, end - start);
  }, 0);
  return Math.round((minutes / 60) * 10) / 10;
}

/** Modèles proposés dans l'éditeur. */
export const WEEK_PRESETS: Array<{ id: string; label: string; windows: DraftWindow[] }> = [
  {
    id: "office",
    label: "Jours ouvrés 06:00 – 20:00",
    windows: [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "06:00", endTime: "20:00" })),
  },
  {
    id: "office-saturday",
    label: "Lun – sam 07:00 – 19:00",
    windows: [1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: "07:00", endTime: "19:00" })),
  },
  {
    id: "night",
    label: "Nuits 22:00 – 06:00",
    windows: [0, 1, 2, 3, 4, 5, 6].flatMap((d) => [
      { dayOfWeek: d, startTime: "00:00", endTime: "06:00" },
      { dayOfWeek: d, startTime: "22:00", endTime: "24:00" },
    ]),
  },
  {
    id: "weekend",
    label: "Week-end entier",
    windows: [6, 0].map((d) => ({ dayOfWeek: d, startTime: "00:00", endTime: "24:00" })),
  },
];
