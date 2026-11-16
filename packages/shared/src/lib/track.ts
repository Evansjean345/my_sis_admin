import type { SpeedBand, TrackPoint, TrackSegment, TrackStop, TrackSummary } from "@shared/types/track";

type FlespiMessage = Record<string, unknown>;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

/** Messages flespi « à plat » → points de trajet exploitables, triés par date. */
export function toTrackPoints(messages: FlespiMessage[], { onlyValidFix = false } = {}): TrackPoint[] {
  const points: TrackPoint[] = [];
  for (const m of messages) {
    const nested = (m.position ?? null) as Record<string, unknown> | null;
    const lat = num(m["position.latitude"]) ?? num(nested?.latitude);
    const lng = num(m["position.longitude"]) ?? num(nested?.longitude);
    const ts = num(m.timestamp);
    // (0,0) = pas de fix : le boîtier émet sans position.
    if (lat === null || lng === null || ts === null || (lat === 0 && lng === 0)) continue;
    const valid = bool(m["position.valid"]);
    if (onlyValidFix && valid === false) continue;
    points.push({
      ts: Math.round(ts * 1000),
      lat,
      lng,
      speed: num(m["position.speed"]) ?? num(nested?.speed) ?? 0,
      direction: num(m["position.direction"]) ?? num(nested?.direction),
      ignition: bool(m["engine.ignition.status"]),
      valid,
    });
  }
  points.sort((a, b) => a.ts - b.ts);
  // Doublons (même horodatage) : on garde le premier.
  return points.filter((p, i) => i === 0 || p.ts !== points[i - 1].ts);
}

/** Distance en km (formule de haversine). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const MOVING_KPH = 3;
const STOP_MIN_MS = 5 * 60_000;
/** Saut aberrant (dérive GPS) : > 250 km/h entre deux points. */
const MAX_PLAUSIBLE_KPH = 250;

function bandOf(speed: number, limit: number | null): SpeedBand {
  if (speed <= MOVING_KPH) return "stopped";
  if (limit !== null && speed > limit) return "overspeed";
  return "normal";
}

/** Tronçons consécutifs de même catégorie de vitesse (une polyline par tronçon). */
export function toSegments(points: TrackPoint[], speedLimit: number | null): TrackSegment[] {
  const segments: TrackSegment[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const band = bandOf(Math.max(prev.speed, cur.speed), speedLimit);
    const last = segments[segments.length - 1];
    if (last && last.band === band) {
      last.points.push([cur.lat, cur.lng]);
    } else {
      segments.push({
        band,
        points: [
          [prev.lat, prev.lng],
          [cur.lat, cur.lng],
        ],
      });
    }
  }
  return segments;
}

export function summarizeTrack(points: TrackPoint[], speedLimit: number | null): TrackSummary {
  let distanceKm = 0;
  let movingMs = 0;
  let maxSpeed = 0;
  let overspeedCount = 0;
  let inOverspeed = false;
  const stops: TrackStop[] = [];
  let stopStart: TrackPoint | null = null;

  points.forEach((p, i) => {
    maxSpeed = Math.max(maxSpeed, p.speed);
    const over = speedLimit !== null && p.speed > speedLimit;
    if (over && !inOverspeed) overspeedCount++;
    inOverspeed = over;

    if (i > 0) {
      const prev = points[i - 1];
      const dt = p.ts - prev.ts;
      const d = haversineKm(prev, p);
      const plausible = dt > 0 && (d / (dt / 3_600_000) <= MAX_PLAUSIBLE_KPH || d < 0.05);
      if (plausible) distanceKm += d;
      if (prev.speed > MOVING_KPH) movingMs += dt;
    }

    if (p.speed <= MOVING_KPH) {
      stopStart ??= p;
    } else if (stopStart) {
      const duration = p.ts - stopStart.ts;
      if (duration >= STOP_MIN_MS) {
        stops.push({ lat: stopStart.lat, lng: stopStart.lng, from: stopStart.ts, to: p.ts, duration });
      }
      stopStart = null;
    }
  });

  const start = points[0] ?? null;
  const end = points[points.length - 1] ?? null;
  if (stopStart && end && end.ts - (stopStart as TrackPoint).ts >= STOP_MIN_MS) {
    const s = stopStart as TrackPoint;
    stops.push({ lat: s.lat, lng: s.lng, from: s.ts, to: end.ts, duration: end.ts - s.ts });
  }

  return {
    points: points.length,
    distanceKm,
    durationMs: start && end ? end.ts - start.ts : 0,
    movingMs,
    maxSpeed,
    avgMovingSpeed: movingMs > 0 ? distanceKm / (movingMs / 3_600_000) : 0,
    overspeedCount,
    stops,
    start,
    end,
  };
}

/** « 2 h 05 », « 12 min », « 45 s » */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, "0")}`;
}
