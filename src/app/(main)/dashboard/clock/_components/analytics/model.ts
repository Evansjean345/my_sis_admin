import type { ScheduleAnalyticsData } from "@/hooks/api/use-schedule-analytics";
import { DEFAULT_TIMEZONE, type ScheduleMode, type UsageScheduleDetail } from "@/types/schedule";

import { type ForecastRule, type ForecastVehicle, weeklyRestrictedHours } from "./forecast";

/**
 * Passage des données de l'API au modèle du prévisionnel : règles par
 * véhicule, chiffres par calendrier, points d'attention.
 */

export interface ScheduleStat {
  schedule: UsageScheduleDetail;
  /** Rattachements par mode : véhicules distincts concernés. */
  vehiclesByMode: Record<ScheduleMode, number>;
  vehiclesCovered: number;
  directCount: number;
  groupCount: number;
  emptyGroups: string[];
  windowHours: number;
  /** Heures-véhicule d'immobilisation par semaine imposées par CE calendrier, pris isolément. */
  vehicleHoursAlone: number;
  /**
   * Calendrier autorisé SANS plage, rattaché à des véhicules : seul, il les
   * immobilise en permanence (un autre calendrier autorisé peut les libérer).
   */
  permanent: boolean;
  withoutEffect: boolean;
}

export interface AnalyticsModel {
  vehicles: ForecastVehicle[];
  stats: ScheduleStat[];
  displayTz: string;
  /** Plusieurs fuseaux parmi les calendriers : les heures sont converties. */
  mixedTimezones: boolean;
  multiScheduleVehicles: ForecastVehicle[];
  emptyGroups: Array<{ id: string; name: string; schedule: string }>;
}

export function buildModel(data: ScheduleAnalyticsData): AnalyticsModel {
  const byVehicle = new Map<string, ForecastVehicle>();
  const add = (id: string, label: string, rule: ForecastRule) => {
    const v = byVehicle.get(id) ?? { id, label, rules: [] };
    // Même calendrier, même mode, reçu deux fois (direct + flotte) : une seule règle suffit au calcul,
    // mais on garde chaque origine pour l'affichage.
    v.rules.push(rule);
    byVehicle.set(id, v);
  };

  const stats: ScheduleStat[] = [];
  const emptyGroups: AnalyticsModel["emptyGroups"] = [];
  const timezones = new Map<string, number>();

  // Le détail d'un calendrier n'embarque pas l'organisation ; la liste, si.
  const organizations = new Map(data.schedules.map((s) => [s.id, s.organization ?? null]));

  for (const detail of data.details) {
    const s = { ...detail, organization: detail.organization ?? organizations.get(detail.id) ?? null };
    timezones.set(s.timezone, (timezones.get(s.timezone) ?? 0) + 1);
    const base = { scheduleId: s.id, scheduleName: s.name, timezone: s.timezone, windows: s.windows };
    const covered: Record<ScheduleMode, Set<string>> = { allowed: new Set(), forbidden: new Set() };
    const statEmpty: string[] = [];

    for (const t of s.vehicles) {
      add(t.id, t.label, { ...base, mode: t.mode, source: { type: "vehicle" } });
      covered[t.mode].add(t.id);
    }
    for (const t of s.vehicleGroups) {
      const group = data.groups.get(t.id);
      const members = group?.members ?? [];
      if (members.length === 0) {
        statEmpty.push(t.label);
        emptyGroups.push({ id: t.id, name: t.label, schedule: s.name });
      }
      for (const m of members) {
        add(m.id, m.label, { ...base, mode: t.mode, source: { type: "group", groupId: t.id, groupName: t.label } });
        covered[t.mode].add(m.id);
      }
    }

    const all = new Set([...covered.allowed, ...covered.forbidden]);
    const windowHours = weeklyRestrictedHours(s.windows, "forbidden");
    stats.push({
      schedule: s,
      vehiclesByMode: { allowed: covered.allowed.size, forbidden: covered.forbidden.size },
      vehiclesCovered: all.size,
      directCount: s.vehicles.length,
      groupCount: s.vehicleGroups.length,
      emptyGroups: statEmpty,
      windowHours,
      vehicleHoursAlone:
        covered.allowed.size * weeklyRestrictedHours(s.windows, "allowed") +
        covered.forbidden.size * weeklyRestrictedHours(s.windows, "forbidden"),
      permanent: covered.allowed.size > 0 && s.windows.length === 0,
      withoutEffect: all.size === 0,
    });
  }

  stats.sort((a, b) => b.vehicleHoursAlone - a.vehicleHoursAlone || a.schedule.name.localeCompare(b.schedule.name));
  const vehicles = [...byVehicle.values()].sort((a, b) => a.label.localeCompare(b.label));
  const ranked = [...timezones.entries()].sort((a, b) => b[1] - a[1]);

  return {
    vehicles,
    stats,
    displayTz: ranked[0]?.[0] ?? DEFAULT_TIMEZONE,
    mixedTimezones: ranked.length > 1,
    multiScheduleVehicles: vehicles.filter((v) => new Set(v.rules.map((r) => r.scheduleId)).size > 1),
    emptyGroups,
  };
}
