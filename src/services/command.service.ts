import { adminPath, api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  BusinessCommandSlug,
  CommandAccepted,
  CommandCatalogEntry,
  CommandHistoryEntry,
  CommandParams,
  CommandSyncReport,
  ExecutedCommand,
  FlespiCommandDefinition,
  GroupCommandResult,
  RawCommandPayload,
  SecurityCommandAccepted,
  SecurityCommandPayload,
} from "@/types/command";

/**
 * =========================================================================
 *  COMMANDES BOÎTIER — règle d'or : toute commande est suivie d'un
 *  POST /admin/devices/:id/commands/sync
 * =========================================================================
 *
 * Le boîtier acquitte en général 2 à 3 s après l'émission. On synchronise
 * donc après un court délai, puis une seconde fois si des commandes sont
 * encore en vol. Le nombre d'appels reste volontairement bas : l'API limite
 * /devices/:id/commands/* et /security/* à 10 requêtes par minute.
 */
const SYNC_DELAYS_MS = [2500, 4000] as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function syncCommands(deviceId: string): Promise<CommandSyncReport> {
  const { data } = await api.post<ApiResponse<CommandSyncReport>>(adminPath(`/devices/${deviceId}/commands/sync`));
  return data.data;
}

/**
 * Exécute une commande PUIS synchronise son état avec flespi.
 * Une synchronisation en échec ne fait pas échouer la commande (elle est
 * déjà partie) : le rapport vaut alors `null`.
 */
export async function runWithSync<T>(deviceId: string, send: () => Promise<T>): Promise<ExecutedCommand<T>> {
  let result: T;
  try {
    result = await send();
  } catch (error) {
    // Même en échec, on réconcilie l'état des commandes en vol (best effort).
    await syncCommands(deviceId).catch(() => undefined);
    throw error;
  }

  let sync: CommandSyncReport | null = null;
  for (const delay of SYNC_DELAYS_MS) {
    await wait(delay);
    try {
      sync = await syncCommands(deviceId);
    } catch {
      break;
    }
    if (sync.stillPending === 0) break;
  }
  return { result, sync };
}

export const commandService = {
  /** POST /devices/:id/commands/sync */
  sync: syncCommands,

  /** GET /devices/:id/commands — catalogue métier SISBM. */
  async catalog(deviceId: string): Promise<CommandCatalogEntry[]> {
    const { data } = await api.get<ApiResponse<CommandCatalogEntry[]>>(adminPath(`/devices/${deviceId}/commands`));
    return data.data;
  },

  /** GET /devices/:id/flespi/commands — catalogue réel accepté par CE boîtier. */
  async flespiCatalog(deviceId: string): Promise<FlespiCommandDefinition[]> {
    const { data } = await api.get<ApiResponse<FlespiCommandDefinition[]>>(
      adminPath(`/devices/${deviceId}/flespi/commands`),
    );
    return data.data;
  },

  /** GET /devices/:id/commands/history */
  async history(deviceId: string): Promise<CommandHistoryEntry[]> {
    const { data } = await api.get<ApiResponse<CommandHistoryEntry[]>>(
      adminPath(`/devices/${deviceId}/commands/history`),
    );
    return data.data;
  },

  /** DELETE /devices/:id/commands/:commandId — annule une commande encore en file. */
  async cancel(deviceId: string, commandId: string): Promise<void> {
    await api.delete(adminPath(`/devices/${deviceId}/commands/${commandId}`));
    await syncCommands(deviceId).catch(() => undefined);
  },

  /** POST /devices/:id/commands/<slug> + sync */
  run(deviceId: string, slug: BusinessCommandSlug, params: CommandParams): Promise<ExecutedCommand<CommandAccepted>> {
    return runWithSync(deviceId, async () => {
      const { data } = await api.post<ApiResponse<CommandAccepted>>(
        adminPath(`/devices/${deviceId}/commands/${slug}`),
        params,
      );
      return data.data;
    });
  },

  /** POST /devices/:id/commands/send (commande flespi brute) + sync */
  send(deviceId: string, payload: RawCommandPayload): Promise<ExecutedCommand<CommandAccepted>> {
    return runWithSync(deviceId, async () => {
      const { data } = await api.post<ApiResponse<CommandAccepted>>(
        adminPath(`/devices/${deviceId}/commands/send`),
        payload,
      );
      return data.data;
    });
  },
};

/**
 * Immobilisation : reste sur les routes `/security/*` (pas de variante admin).
 * Le cas d'usage applique le garde-fou de vitesse puis émet la commande dans la
 * foulée (plus de double validation). Ouvert aux trois rôles
 * (`command:immobilize`).
 */
export const securityService = {
  /**
   * POST /security/immobilizations + sync.
   * Exige : immobilizationEnabled, boîtier à relais monté, position < 2 min.
   */
  immobilize(deviceId: string, payload: SecurityCommandPayload): Promise<ExecutedCommand<SecurityCommandAccepted>> {
    return runWithSync(deviceId, async () => {
      const { data } = await api.post<ApiResponse<SecurityCommandAccepted>>("/security/immobilizations", payload);
      return data.data;
    });
  },

  /**
   * POST /security/vehicle-groups/:id/immobilizations — coupure IMMÉDIATE de
   * chaque véhicule d'une flotte (100 max). Chaque véhicule passe par le
   * chemin unitaire : un véhicule qui roule est refusé sans bloquer les autres.
   * Pas de synchronisation ici : la réponse porte le sort de chaque véhicule.
   */
  async immobilizeGroup(groupId: string, reason: string): Promise<GroupCommandResult> {
    const { data } = await api.post<ApiResponse<GroupCommandResult>>(
      `/security/vehicle-groups/${groupId}/immobilizations`,
      { reason },
    );
    return data.data;
  },

  /** POST /security/vehicle-groups/:id/restorations */
  async restoreGroup(groupId: string, reason: string): Promise<GroupCommandResult> {
    const { data } = await api.post<ApiResponse<GroupCommandResult>>(
      `/security/vehicle-groups/${groupId}/restorations`,
      { reason },
    );
    return data.data;
  },

  /** POST /security/restorations + sync (rétablissement carburant / alimentation). */
  restore(deviceId: string, payload: SecurityCommandPayload): Promise<ExecutedCommand<SecurityCommandAccepted>> {
    return runWithSync(deviceId, async () => {
      const { data } = await api.post<ApiResponse<SecurityCommandAccepted>>("/security/restorations", payload);
      return data.data;
    });
  },
};
