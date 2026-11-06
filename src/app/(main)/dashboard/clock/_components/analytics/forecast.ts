/**
 * =========================================================================
 *  PRÉVISIONNEL DE L'IMMOBILISATION PLANIFIÉE — calcul pur, sans React
 * =========================================================================
 *
 * À partir des calendriers ACTIFS et de leurs rattachements (directs et par
 * flotte), calcule pour chaque véhicule les périodes où le moteur planifié
 * VEUT l'immobiliser, puis les agrège par jour et par heure.
 *
 * C'est la même règle de combinaison que le back-end
 * (`domain/scheduling/usage_policy.ts`), appliquée sur des intervalles
 * plutôt qu'à un instant :
 *
 *   immobilisé = ⋃ plages interdites  ∪  (si ≥ 1 calendrier autorisé) ∁ ⋃ plages autorisées
 *
 * Ce n'est PAS l'historique : un véhicule en mouvement, sans relais ou dont
 * l'immobilisation est désactivée ne sera pas coupé à l'heure dite (CM-07…).
 *
 * Fuseaux : chaque plage est lue dans le fuseau de SON calendrier, convertie
 * en instants UTC exacts, puis ventilée dans le fuseau d'affichage. Les
 * changements d'heure sont gérés (journées de 23 ou 25 heures).
 *
 * Aucune dépendance d'exécution (imports de types seulement) : le module se
 * teste directement avec `node`.
 */

export type ForecastMode = "allowed" | "forbidden";

export interface ForecastWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ForecastRule {
  scheduleId: string;
  scheduleName: string;
  timezone: string;
  mode: ForecastMode;
  windows: ForecastWindow[];
  source: { type: "vehicle" } | { type: "group"; groupId: string; groupName: string };
}

export interface ForecastVehicle {
  id: string;
  label: string;
  rules: ForecastRule[];
}

/** Date civile (sans fuseau) : année, mois 1-12, jour. */
export interface CivilDate {
  y: number;
  m: number;
  d: number;
}

type Interval = [start: number, end: number];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// ---------------------------------------------------------------------------
// Dates civiles
// ---------------------------------------------------------------------------

export function addDays(date: CivilDate, days: number): CivilDate {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d + days));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 0 = dimanche … 6 = samedi (convention du back-end). */
export function weekday(date: CivilDate): number {
  return new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
}

export function toIsoDate(date: CivilDate): string {
  return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
}

export function fromIsoDate(value: string): CivilDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const date = { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  return toIsoDate(addDays(date, 0)) === value ? date : null;
}

export function compareDates(a: CivilDate, b: CivilDate): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

// ---------------------------------------------------------------------------
// Fuseaux
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

interface ZonedParts extends CivilDate {
  hour: number;
  minute: number;
  second: number;
}

export function zonedParts(ms: number, timeZone: string): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return { y: out.year, m: out.month, d: out.day, hour: out.hour % 24, minute: out.minute, second: out.second };
}

/** Décalage du fuseau à cet instant, en ms (Abidjan : 0 ; Paris l'été : +2 h). */
export function tzOffset(ms: number, timeZone: string): number {
  const base = Math.floor(ms / 1000) * 1000;
  const p = zonedParts(base, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute, p.second) - base;
}

/**
 * Mémo des conversions : les mêmes (fuseau, jour, heure) reviennent pour chaque
 * calendrier et chaque heure affichée, et `formatToParts` est coûteux.
 */
const zonedCache = new Map<string, number>();

/** Instant UTC d'une heure locale (minutes depuis minuit, 1440 = minuit suivant). */
export function zonedToUtc(date: CivilDate, minutes: number, timeZone: string): number {
  const key = `${timeZone}|${date.y}-${date.m}-${date.d}|${minutes}`;
  const cached = zonedCache.get(key);
  if (cached !== undefined) return cached;
  const guess = Date.UTC(date.y, date.m - 1, date.d) + minutes * MINUTE;
  const first = tzOffset(guess, timeZone);
  const t = guess - first;
  const second = tzOffset(t, timeZone);
  const result = second === first ? t : guess - second;
  if (zonedCache.size > 50_000) zonedCache.clear();
  zonedCache.set(key, result);
  return result;
}

export function todayIn(timeZone: string, now = Date.now()): CivilDate {
  const p = zonedParts(now, timeZone);
  return { y: p.y, m: p.m, d: p.d };
}

// ---------------------------------------------------------------------------
// Plages
// ---------------------------------------------------------------------------

const TIME = /^([01]\d|2[0-4]):([0-5]\d)/;

function minutesOf(value: string, isEnd: boolean): number | null {
  const m = TIME.exec(value);
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  if (minutes > 1440) return null;
  // Une fin à 00:00 est lue comme minuit (24:00), comme dans l'éditeur.
  return isEnd && minutes === 0 ? 1440 : minutes;
}

function merge(intervals: Interval[]): Interval[] {
  if (intervals.length < 2) return intervals.filter(([s, e]) => e > s);
  const sorted = intervals.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]);
  const out: Interval[] = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

function complement(intervals: Interval[], start: number, end: number): Interval[] {
  const out: Interval[] = [];
  let cursor = start;
  for (const [s, e] of intervals) {
    if (s > cursor) out.push([cursor, Math.min(s, end)]);
    cursor = Math.max(cursor, e);
    if (cursor >= end) break;
  }
  if (cursor < end) out.push([cursor, end]);
  return out.filter(([s, e]) => e > s);
}

/** Occurrences des plages d'un calendrier entre deux instants (fusionnées, bornées). */
export function occurrences(
  schedule: { timezone: string; windows: ForecastWindow[] },
  start: number,
  end: number,
): Interval[] {
  if (schedule.windows.length === 0 || end <= start) return [];
  const first = addDays(todayIn(schedule.timezone, start), -1);
  const last = addDays(todayIn(schedule.timezone, end), 1);
  const out: Interval[] = [];
  for (let day = first; compareDates(day, last) <= 0; day = addDays(day, 1)) {
    const dow = weekday(day);
    for (const w of schedule.windows) {
      if (w.dayOfWeek !== dow) continue;
      const s = minutesOf(w.startTime, false);
      const e = minutesOf(w.endTime, true);
      if (s === null || e === null || e <= s) continue;
      const a = Math.max(start, zonedToUtc(day, s, schedule.timezone));
      const b = Math.min(end, zonedToUtc(day, e, schedule.timezone));
      if (b > a) out.push([a, b]);
    }
  }
  return merge(out);
}

/** Périodes d'immobilisation voulues par le moteur pour un jeu de règles. */
export function restrictedIntervals(rules: ForecastRule[], start: number, end: number): Interval[] {
  if (rules.length === 0) return [];
  const forbidden = merge(rules.filter((r) => r.mode === "forbidden").flatMap((r) => occurrences(r, start, end)));
  const allowedRules = rules.filter((r) => r.mode === "allowed");
  if (allowedRules.length === 0) return forbidden;
  const allowed = merge(allowedRules.flatMap((r) => occurrences(r, start, end)));
  return merge([...forbidden, ...complement(allowed, start, end)]);
}

// ---------------------------------------------------------------------------
// Agrégats
// ---------------------------------------------------------------------------

export interface DayForecast {
  date: string;
  start: number;
  end: number;
  /** Heures-véhicule d'immobilisation prévues sur la journée. */
  vehicleHours: number;
  /** Véhicules immobilisés au moins une minute. */
  affected: number;
  /** Plus grand nombre de véhicules immobilisés en même temps. */
  peak: number;
  peakAt: number | null;
  /**
   * Transitions prévues ce jour-là (en véhicules) : début d'une immobilisation
   * = une coupure à émettre, fin = un rétablissement. Les bornes de la période
   * calculée ne comptent pas (on ignore ce qui précède).
   */
  cutsPlanned: number;
  restoresPlanned: number;
  /** Par heure locale : véhicules immobilisés en moyenne sur l'heure. */
  hours: number[];
  /** Début de chaque heure (UTC) — 23 ou 25 entrées les jours de changement d'heure. */
  hourStarts: number[];
}

export interface ForecastResult {
  days: DayForecast[];
  /** Véhicules soumis à au moins un calendrier actif. */
  managed: number;
  /** Véhicules immobilisés sur TOUTE la période (calendrier autorisé sans plage, interdiction 24 h/24…). */
  alwaysRestricted: number;
}

interface Cohort {
  count: number;
  intervals: Interval[];
}

/** Clé d'un jeu de règles : les véhicules d'une même flotte partagent le calcul. */
function signature(rules: ForecastRule[]): string {
  return [...new Set(rules.map((r) => `${r.scheduleId}:${r.mode}`))].sort().join("|");
}

function cohorts(vehicles: ForecastVehicle[], start: number, end: number): Cohort[] {
  const bySignature = new Map<string, { rules: ForecastRule[]; count: number }>();
  for (const v of vehicles) {
    if (v.rules.length === 0) continue;
    const key = signature(v.rules);
    const entry = bySignature.get(key);
    if (entry) entry.count += 1;
    else bySignature.set(key, { rules: v.rules, count: 1 });
  }
  return [...bySignature.values()].map(({ rules, count }) => ({
    count,
    intervals: restrictedIntervals(rules, start, end),
  }));
}

function overlap([s, e]: Interval, a: number, b: number): number {
  return Math.max(0, Math.min(e, b) - Math.max(s, a));
}

/**
 * Prévisionnel jour par jour, dans le fuseau d'affichage, à partir de `from`
 * (date civile dans ce fuseau) et sur `days` jours.
 */
export function forecast(
  vehicles: ForecastVehicle[],
  options: { displayTz: string; from: CivilDate; days: number },
): ForecastResult {
  const { displayTz, from, days } = options;
  const dayStarts: number[] = [];
  for (let i = 0; i <= days; i++) dayStarts.push(zonedToUtc(addDays(from, i), 0, displayTz));
  const start = dayStarts[0];
  const end = dayStarts[days];
  const groups = cohorts(vehicles, start, end);

  const result: DayForecast[] = [];
  // Intervalles triés et jours croissants : un curseur par cohorte évite de
  // reparcourir toute la période chaque jour.
  const cursors = groups.map(() => 0);
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const ds = dayStarts[i];
    const de = dayStarts[i + 1];
    const hourStarts: number[] = [];
    for (let h = 0; h < 24; h++) {
      const t = zonedToUtc(date, h * 60, displayTz);
      if (t >= ds && t < de && hourStarts[hourStarts.length - 1] !== t) hourStarts.push(t);
    }
    const hours = hourStarts.map(() => 0);
    let vehicleMs = 0;
    let affected = 0;
    let cutsPlanned = 0;
    let restoresPlanned = 0;
    const events: Array<[number, number]> = [];

    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      let touched = false;
      while (cursors[gi] < g.intervals.length && g.intervals[cursors[gi]][1] <= ds) {
        // Fin à minuit pile : le rétablissement appartient au jour qui commence.
        const fin = g.intervals[cursors[gi]][1];
        if (fin === ds && fin < end) restoresPlanned += g.count;
        cursors[gi] += 1;
      }
      for (let k = cursors[gi]; k < g.intervals.length; k++) {
        const iv = g.intervals[k];
        if (iv[0] >= de) break;
        if (iv[0] > start && iv[0] >= ds) cutsPlanned += g.count;
        if (iv[1] < end && iv[1] < de) restoresPlanned += g.count;
        touched = true;
        vehicleMs += overlap(iv, ds, de) * g.count;
        events.push([Math.max(iv[0], ds), g.count], [Math.min(iv[1], de), -g.count]);
        for (let h = 0; h < hourStarts.length; h++) {
          const hs = hourStarts[h];
          const he = hourStarts[h + 1] ?? de;
          if (he <= iv[0]) continue;
          if (hs >= iv[1]) break;
          const ms = overlap(iv, hs, he);
          if (ms > 0) hours[h] += (ms * g.count) / (he - hs);
        }
      }
      if (touched) affected += g.count;
    }

    // Balayage : les fins passent avant les débuts au même instant (fin exclue).
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let current = 0;
    let peak = 0;
    let peakAt: number | null = null;
    for (const [t, delta] of events) {
      current += delta;
      if (current > peak) {
        peak = current;
        peakAt = t;
      }
    }

    result.push({
      date: toIsoDate(date),
      start: ds,
      end: de,
      vehicleHours: vehicleMs / HOUR,
      affected,
      peak,
      peakAt,
      cutsPlanned,
      restoresPlanned,
      hours,
      hourStarts,
    });
  }

  const span = end - start;
  return {
    days: result,
    managed: groups.reduce((s, g) => s + g.count, 0),
    alwaysRestricted: groups
      .filter((g) => g.intervals.length === 1 && g.intervals[0][0] <= start && g.intervals[0][1] >= start + span)
      .reduce((s, g) => s + g.count, 0),
  };
}

/** Véhicules que le moteur veut immobilisés à cet instant. */
export function restrictedAt(vehicles: ForecastVehicle[], at: number): ForecastVehicle[] {
  const bySignature = new Map<string, boolean>();
  return vehicles.filter((v) => {
    if (v.rules.length === 0) return false;
    const key = signature(v.rules);
    let restricted = bySignature.get(key);
    if (restricted === undefined) {
      restricted = restrictedIntervals(v.rules, at, at + MINUTE).some(([s]) => s <= at);
      bySignature.set(key, restricted);
    }
    return restricted;
  });
}

/**
 * Heures d'immobilisation par semaine qu'impose un calendrier SEUL à un
 * véhicule (autorisé : 168 h − plages ; interdit : plages).
 */
export function weeklyRestrictedHours(windows: ForecastWindow[], mode: ForecastMode): number {
  const minutes = windows.reduce((sum, w) => {
    const s = minutesOf(w.startTime, false) ?? 0;
    const e = minutesOf(w.endTime, true) ?? 0;
    return sum + Math.max(0, e - s);
  }, 0);
  const windowHours = minutes / 60;
  return mode === "allowed" ? 168 - windowHours : windowHours;
}
