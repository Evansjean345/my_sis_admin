import type { ScheduleHistoryDay } from "@/types/schedule";

import type { DayForecast } from "./forecast";
import { formatHours, formatVehicles } from "./format";

/**
 * Indicateurs affichables dans le calendrier du mois, pour chaque source :
 * le PRÉVU (calculé ici à partir des calendriers) et le RÉEL (historique du
 * moteur agrégé par le back-end).
 */
export type Source = "prevu" | "reel";

export interface MetricDef<T> {
  label: string;
  /** Phrase d'unité : légende et étiquettes accessibles. */
  unit: string;
  format: (value: number) => string;
  value: (day: T) => number;
}

const count = (v: number) => formatVehicles(v);

export const PLANNED_METRICS = {
  vehicleHours: {
    label: "Heures-véhicule",
    unit: "Heures-véhicule d'immobilisation",
    format: formatHours,
    value: (d) => d.vehicleHours,
  },
  affected: {
    label: "Véhicules concernés",
    unit: "Véhicules immobilisés au moins une fois",
    format: count,
    value: (d) => d.affected,
  },
  peak: {
    label: "Pic simultané",
    unit: "Véhicules immobilisés en même temps (max.)",
    format: count,
    value: (d) => d.peak,
  },
} satisfies Record<string, MetricDef<DayForecast>>;

export const REAL_METRICS = {
  confirmedCuts: {
    label: "Coupures confirmées",
    unit: "Coupures confirmées par le boîtier",
    format: count,
    value: (d) => d.cut.acknowledged,
  },
  refusals: {
    label: "Refus",
    unit: "Tentatives refusées avant émission",
    format: count,
    value: (d) => d.refusals,
  },
  failures: {
    label: "Échecs",
    unit: "Commandes échouées ou expirées",
    format: count,
    value: (d) => d.cut.failed + d.cut.expired + d.restore.failed + d.restore.expired,
  },
} satisfies Record<string, MetricDef<ScheduleHistoryDay>>;

export type PlannedMetric = keyof typeof PLANNED_METRICS;
export type RealMetric = keyof typeof REAL_METRICS;

/** Une case du calendrier, quelle que soit la source. */
export interface DayCell {
  date: string;
  value: number;
}
