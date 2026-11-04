/**
 * Plus de double validation (API, migration 016) : une commande naît
 * `approved` (acceptée, pas encore émise), puis queued → sent → acknowledged.
 */
export type CommandStatus =
  | "approved"
  | "queued"
  | "sent"
  | "acknowledged"
  | "failed"
  | "expired"
  | "cancelled"
  | (string & {});

export type CommandType = "engine_cut" | "engine_restore" | "locate" | "reboot" | "set_interval" | "custom";

export type CommandMode = "queue" | "instant";

/** Slugs des routes métier : POST /devices/:id/commands/<slug> */
export type BusinessCommandSlug =
  | "request-status"
  | "reboot"
  | "start-tracking"
  | "stop-tracking"
  | "arm"
  | "disarm"
  | "set-output"
  | "set-admin-number"
  | "change-password"
  | "reset-password"
  | "set-apn"
  | "add-geofence"
  | "remove-geofence";

export interface CommandParams {
  reason: string;
  data?: string;
  mode?: CommandMode;
  ttl?: number;
}

export interface FlespiCommand {
  name: string;
  properties: Record<string, unknown>;
}

export interface RawCommandPayload {
  name: string;
  properties?: Record<string, unknown>;
  reason: string;
  mode?: CommandMode;
  ttl?: number;
  confirm?: boolean;
}

/** Réponse 202 des routes métier et de /commands/send */
export interface CommandAccepted {
  commandId: string;
  command: FlespiCommand;
  mode: CommandMode;
  status: CommandStatus;
  providerCommandId: string | null;
  response: unknown;
  expiresAt: string | null;
}

/** Réponse 202 de /security/immobilizations et /security/restorations */
export interface SecurityCommandAccepted {
  commandId: string;
  commandType: "engine_cut" | "engine_restore";
  status: CommandStatus;
  providerCommandId: string | null;
}

export interface SecurityCommandPayload {
  vehicleId: string;
  reason: string;
  alertId?: string;
}

/** POST /devices/:id/commands/sync */
export interface CommandSyncReport {
  acknowledged: number;
  failed: number;
  expired: number;
  stillPending: number;
}

/** GET /devices/:id/commands/history — colonnes SQL, donc snake_case. */
export interface CommandHistoryEntry {
  id: string;
  command_type: CommandType | (string & {});
  status: CommandStatus;
  reason: string;
  origin: string;
  requested_by: string | null;
  requested_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  failed_at: string | null;
  expires_at: string | null;
  error_message: string | null;
  provider_command_id: string | null;
  safety_context: Record<string, unknown>;
}

/** GET /devices/:id/commands — catalogue métier SISBM */
export interface CommandCatalogEntry {
  name: string;
  label: string;
  flespiCommand: FlespiCommand;
  requiresData: boolean;
  sensitive: boolean;
  verified: boolean;
  endpoint: string;
}

/** GET /devices/:id/flespi/commands — catalogue réel flespi */
export interface FlespiCommandDefinition {
  name: string;
  title: string | null;
  description: string | null;
  tab: string | null;
  address: string[];
  schema: Record<string, unknown> | null;
  examples: unknown[];
}

/** Résultat agrégé « commande + synchronisation » exposé par le runner. */
export interface ExecutedCommand<T> {
  result: T;
  sync: CommandSyncReport | null;
}
