import { type CivilDate, fromIsoDate } from "./forecast";

const hours1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const hours0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

/** Heures (heures-véhicule) : « 7,5 h », « 312 h », « 12,4 k h ». */
export function formatHours(value: number): string {
  if (value >= 10_000) return `${compact.format(value)} h`;
  return `${value < 10 ? hours1.format(value) : hours0.format(value)} h`;
}

/** Véhicules en moyenne sur une heure : entier quand c'en est un, sinon une décimale. */
export function formatVehicles(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? hours0.format(rounded) : hours1.format(rounded);
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

/** « 06:00 » dans le fuseau d'affichage. */
export function formatClock(ms: number, timeZone: string): string {
  let f = timeFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    timeFormatters.set(timeZone, f);
  }
  return f.format(new Date(ms));
}

function civil(value: string | CivilDate): CivilDate | null {
  return typeof value === "string" ? fromIsoDate(value) : value;
}

function utcFormat(options: Intl.DateTimeFormatOptions) {
  const f = new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" });
  return (value: string | CivilDate) => {
    const d = civil(value);
    return d ? f.format(new Date(Date.UTC(d.y, d.m - 1, d.d))) : "";
  };
}

/** « lundi 4 novembre » */
export const formatDayLong = utcFormat({ weekday: "long", day: "numeric", month: "long" });
/** « 4 nov. » */
export const formatDayShort = utcFormat({ day: "numeric", month: "short" });
/** « novembre 2026 » */
export const formatMonth = utcFormat({ month: "long", year: "numeric" });
/** « lun. » */
export const formatWeekdayShort = utcFormat({ weekday: "short" });

/** Durée lisible : « 45 s », « 2 min 10 s », « 17 min », « 1 h 05 ». */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  if (s < 600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, "0")}`;
}

/** « 87 % » ; « — » sans dénominateur. */
export function formatRate(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)} %` : "—";
}
