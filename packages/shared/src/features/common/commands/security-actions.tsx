"use client";

import { useState } from "react";

import { Fuel, PowerOff } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip";
import { CommandDialog } from "@shared/features/common/commands/command-dialog";
import { notifyCommandError, notifyCommandResult } from "@shared/features/common/commands/command-feedback";
import { useImmobilizeVehicle, useRestoreVehicle } from "@shared/hooks/api/use-commands";

interface SecurityActionsProps {
  vehicleId: string;
  /** Boîtier monté : nécessaire pour la synchronisation des commandes. */
  deviceId: string | null | undefined;
  immobilizationEnabled: boolean;
  hasRelay: boolean;
  size?: "sm" | "default";
}

/**
 * Immobilisation (S20 1,1) et rétablissement (S20 0,0) d'un véhicule.
 * Passe par /security/* (garde-fou de vitesse, fraîcheur de position,
 * traçabilité), puis synchronise les commandes du boîtier.
 */
export function SecurityActions({
  vehicleId,
  deviceId,
  immobilizationEnabled,
  hasRelay,
  size = "sm",
}: SecurityActionsProps) {
  const [dialog, setDialog] = useState<"cut" | "restore" | null>(null);
  const immobilize = useImmobilizeVehicle();
  const restore = useRestoreVehicle();

  const blocker = !deviceId
    ? "Aucun tracker monté sur ce véhicule."
    : !hasRelay
      ? "Le tracker monté n'a pas de relais."
      : !immobilizationEnabled
        ? "L'immobilisation est désactivée pour ce véhicule."
        : null;

  const cutButton = (
    <Button size={size} variant="destructive" disabled={Boolean(blocker)} onClick={() => setDialog("cut")}>
      <PowerOff data-icon="inline-start" />
      Immobiliser
    </Button>
  );

  const restoreButton = (
    <Button size={size} variant="outline" disabled={!deviceId || !hasRelay} onClick={() => setDialog("restore")}>
      <Fuel data-icon="inline-start" />
      Rétablir le carburant
    </Button>
  );

  return (
    <>
      {blocker ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{cutButton}</span>
          </TooltipTrigger>
          <TooltipContent>{blocker}</TooltipContent>
        </Tooltip>
      ) : (
        cutButton
      )}
      {restoreButton}

      <CommandDialog
        open={dialog === "cut"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Immobiliser le véhicule"
        description="Coupe l'huile et l'alimentation (S20 1,1) via le contrôle de sécurité."
        warning="Le véhicule doit être à l'arrêt avec une position de moins de 2 minutes. Assurez-vous que personne n'est en danger."
        confirmLabel="Immobiliser"
        destructive
        pending={immobilize.isPending}
        onSubmit={({ reason }) => {
          if (!deviceId) return;
          immobilize.mutate(
            { deviceId, payload: { vehicleId, reason } },
            {
              onSuccess: (executed) => {
                notifyCommandResult("Immobilisation", executed);
                setDialog(null);
              },
              onError: (error) => notifyCommandError("Immobilisation", error),
            },
          );
        }}
      />

      <CommandDialog
        open={dialog === "restore"}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Rétablir le carburant"
        description="Rétablit l'huile et l'alimentation (S20 0,0). Demande et émission en un seul appel."
        confirmLabel="Rétablir"
        pending={restore.isPending}
        onSubmit={({ reason }) => {
          if (!deviceId) return;
          restore.mutate(
            { deviceId, payload: { vehicleId, reason } },
            {
              onSuccess: (executed) => {
                notifyCommandResult("Rétablissement", executed);
                setDialog(null);
              },
              onError: (error) => notifyCommandError("Rétablissement", error),
            },
          );
        }}
      />
    </>
  );
}
