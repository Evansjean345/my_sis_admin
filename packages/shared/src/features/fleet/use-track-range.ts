"use client";

import { useEffect, useMemo, useState } from "react";

import { endOfDay, startOfDay, subDays, subHours } from "date-fns";

import type { TrackRange } from "@shared/types/track";

export type TrackPeriod = "1h" | "6h" | "24h" | "today" | "yesterday" | "day";

export const PERIOD_LABELS: Record<TrackPeriod, string> = {
  "1h": "1 h",
  "6h": "6 h",
  "24h": "24 h",
  today: "Aujourd'hui",
  yesterday: "Hier",
  day: "Date…",
};

const ROLLING: TrackPeriod[] = ["1h", "6h", "24h", "today"];

/**
 * Fenêtre temporelle du trajet. Les périodes glissantes sont recalculées
 * toutes les minutes (et non à chaque rendu, sinon la clé de requête change en boucle).
 */
export function useTrackRange(period: TrackPeriod, day: string): TrackRange {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    if (!ROLLING.includes(period)) return;
    setTick(Date.now());
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [period]);

  return useMemo(() => {
    // Arrondi à la minute : clé de cache stable entre deux ticks.
    const now = new Date(Math.floor(tick / 60_000) * 60_000);
    switch (period) {
      case "1h":
        return { from: subHours(now, 1), to: now };
      case "6h":
        return { from: subHours(now, 6), to: now };
      case "24h":
        return { from: subHours(now, 24), to: now };
      case "today":
        return { from: startOfDay(now), to: now };
      case "yesterday": {
        const y = subDays(now, 1);
        return { from: startOfDay(y), to: endOfDay(y) };
      }
      default: {
        const d = day ? new Date(`${day}T00:00:00`) : now;
        return { from: startOfDay(d), to: endOfDay(d) };
      }
    }
  }, [period, day, tick]);
}
