import { Transmit } from "@adonisjs/transmit-client";

import { getToken } from "@shared/lib/auth-token";
import { API_URL } from "@shared/lib/axios";

/**
 * =========================================================================
 *  TEMPS RÉEL — client AdonisJS Transmit (Server-Sent Events)
 * =========================================================================
 *
 * L'API diffuse le temps réel avec `@adonisjs/transmit` (cf. back-end
 * `start/transmit.ts`) : un flux SSE `GET /__transmit/events`, puis un
 * abonnement par canal `POST /__transmit/subscribe`. Pour un suivi GPS, le
 * sens serveur → navigateur suffit : SSE est l'équivalent « une voie » d'un
 * WebSocket, se reconnecte seul et traverse les proxys HTTP sans réglage.
 *
 * Canaux, cloisonnés par organisation côté API :
 *   org/<organizationId>/positions  dernière position d'un véhicule
 *   org/<organizationId>/devices    présence d'un boîtier (fix, signal, batterie)
 *
 * L'ouverture du flux n'est pas authentifiée (un `EventSource` n'envoie pas
 * d'en-tête) ; c'est l'ABONNEMENT qui l'est : le jeton part en
 * `Authorization: Bearer` sur `/__transmit/subscribe`, et l'API refuse tout
 * canal d'une autre organisation (sauf joker `*`).
 */

/** Charge utile de `org/:id/positions` (back-end : ingest_telemetry_frames.ts). */
export interface PositionEvent {
  vehicleId: string | null;
  deviceId: string;
  latitude: number;
  longitude: number;
  speedKph: number;
  ignition: boolean | null;
  /** ISO 8601 — horodatage GPS. */
  recordedAt: string;
}

/** Charge utile de `org/:id/devices` (back-end : DeviceStatusPayload). */
export interface DeviceStatusEvent {
  deviceId: string;
  vehicleId: string | null;
  ident: string;
  lastSeenAt: string;
  lastRecordedAt: string;
  hasFix: boolean;
  /** Trame en différé (Store & Forward). */
  delayed: boolean;
  ignition: boolean | null;
  gsmSignal: number | null;
  batteryPct: number | null;
}

export const positionsChannel = (organizationId: string) => `org/${organizationId}/positions`;
export const devicesChannel = (organizationId: string) => `org/${organizationId}/devices`;

let client: Transmit | null = null;

function authenticate(request: Request) {
  const token = getToken();
  if (token) request.headers.set("Authorization", `Bearer ${token}`);
  // Même raison que dans `lib/axios.ts` : un tunnel ngrok renverrait sa page HTML.
  request.headers.set("ngrok-skip-browser-warning", "true");
}

/** Client unique du navigateur ; `null` côté serveur ou sans URL d'API. */
export function getTransmit(): Transmit | null {
  if (typeof window === "undefined" || !API_URL) return null;
  client ??= new Transmit({
    baseUrl: API_URL,
    beforeSubscribe: authenticate,
    beforeUnsubscribe: authenticate,
    maxReconnectAttempts: 20,
  });
  return client;
}

/** À la déconnexion : ferme le flux, le prochain compte repart d'un client neuf. */
export function closeTransmit(): void {
  client?.close();
  client = null;
}
