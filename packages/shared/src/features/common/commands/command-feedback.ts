import { toast } from "sonner";

import { getErrorMessage } from "@shared/lib/axios";
import { ApiError } from "@shared/types/api";
import type { CommandSyncReport, ExecutedCommand } from "@shared/types/command";

function describeSync(sync: CommandSyncReport | null): string {
  if (!sync) return "Synchronisation indisponible : utilisez « Synchroniser » dans l'historique.";
  const parts: string[] = [];
  if (sync.acknowledged) parts.push(`${sync.acknowledged} acquittée(s)`);
  if (sync.failed) parts.push(`${sync.failed} en échec`);
  if (sync.expired) parts.push(`${sync.expired} expirée(s)`);
  if (sync.stillPending) parts.push(`${sync.stillPending} encore en attente`);
  return parts.length ? `Synchronisation : ${parts.join(", ")}.` : "Synchronisation effectuée.";
}

/** Toast de résultat d'une commande « envoi + sync ». */
export function notifyCommandResult<T extends { status: string }>(label: string, executed: ExecutedCommand<T>) {
  const { result, sync } = executed;
  const description = describeSync(sync);
  if (result.status === "failed" || (sync && sync.failed > 0)) {
    toast.error(`${label} : échec côté boîtier`, { description });
  } else if (sync && sync.stillPending > 0) {
    toast.warning(`${label} : envoyée, en attente d'acquittement`, { description });
  } else {
    toast.success(`${label} : exécutée`, { description });
  }
}

const COMMAND_ERROR_HINTS: Record<string, string> = {
  E_TOO_MANY_REQUESTS: "Limite de 10 commandes par minute atteinte.",
  E_USE_IMMOBILIZATION_ENDPOINT: "La coupure moteur passe uniquement par l'immobilisation du véhicule.",
  E_CONFIRMATION_REQUIRED: "Ce réglage exige une confirmation explicite.",
  E_MISSING_COMMAND_DATA: "Cette commande exige un paramètre.",
  E_NO_FLESPI_DEVICE: "Le tracker n'est pas rattaché à flespi.",
};

export function notifyCommandError(label: string, error: unknown) {
  const hint = error instanceof ApiError ? COMMAND_ERROR_HINTS[error.code] : undefined;
  toast.error(`${label} : refusée`, {
    description: hint ? `${hint} ${getErrorMessage(error)}` : getErrorMessage(error),
  });
}
