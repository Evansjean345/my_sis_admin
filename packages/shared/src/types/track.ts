/** Point de trajet issu de l'historique flespi (GET /devices/:id/telemetry/history). */
export interface TrackPoint {
  /** Horodatage en millisecondes. */
  ts: number;
  lat: number;
  lng: number;
  /** km/h */
  speed: number;
  /** Cap en degrés (0 = nord), si fourni par le boîtier. */
  direction: number | null;
  ignition: boolean | null;
  /** Fix GPS valide ; `null` si inconnu. */
  valid: boolean | null;
}

export type SpeedBand = "stopped" | "normal" | "overspeed";

export interface TrackSegment {
  band: SpeedBand;
  points: Array<[number, number]>;
}

export interface TrackStop {
  lat: number;
  lng: number;
  from: number;
  to: number;
  /** Durée en millisecondes. */
  duration: number;
}

export interface TrackSummary {
  points: number;
  distanceKm: number;
  durationMs: number;
  movingMs: number;
  maxSpeed: number;
  avgMovingSpeed: number;
  overspeedCount: number;
  stops: TrackStop[];
  start: TrackPoint | null;
  end: TrackPoint | null;
}

export interface TrackRange {
  from: Date;
  to: Date;
}
