"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Activity,
  Eye,
  History,
  Link2,
  MoreVertical,
  Radio,
  Stethoscope,
  Terminal,
  Trash2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { AssignDialog } from "@shared/features/common/assignment/assign-dialog";
import { UnassignDialog } from "@shared/features/common/assignment/unassign-dialog";
import { deviceHref } from "@shared/features/device/device-links";
import { useDeleteDevice } from "@shared/hooks/api/use-devices";
import { getErrorMessage } from "@shared/lib/axios";
import type { Device } from "@shared/types/device";

interface DeviceActionsProps {
  device: Device;
  /** Menu complet (carte « en cours d'utilisation ») ou réduit (liste / grille). */
  variant?: "full" | "compact";
  showDetails?: boolean;
  onDeleted?: () => void;
}

export function DeviceActions({ device, variant = "compact", showDetails = true, onDeleted }: DeviceActionsProps) {
  const [dialog, setDialog] = useState<"assign" | "unassign" | "delete" | null>(null);
  const remove = useDeleteDevice();
  const linked = Boolean(device.flespiDeviceId);
  const close = (open: boolean) => !open && setDialog(null);
  const access = useOptionalAccess();
  // Montage / démontage : `device:write` (administrateur). Suppression : exploitant
  // seulement — l'API d'organisation répond 403 E_PLATFORM_ONLY.
  const canAssign = access?.can("device:write") ?? false;
  const canDelete = access?.isPlatform ?? false;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${device.imei}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          {showDetails ? (
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={deviceHref(device.id)} prefetch={false}>
                  <Eye />
                  Voir plus de détails
                </Link>
              </DropdownMenuItem>
              {variant === "full" ? (
                <>
                  <DropdownMenuItem asChild disabled={!linked}>
                    <Link href={deviceHref(device.id, "commands")} prefetch={false}>
                      <Terminal />
                      Lancer une commande
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={deviceHref(device.id, "commands")} prefetch={false}>
                      <History />
                      Historique des commandes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={!linked}>
                    <Link href={deviceHref(device.id, "logs")} prefetch={false}>
                      <Radio />
                      Vérifier l'état de la connexion
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={!linked}>
                    <Link href={deviceHref(device.id, "telemetry")} prefetch={false}>
                      <Activity />
                      Dernière valeur télémétrique
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild disabled={!linked}>
                    <Link href={deviceHref(device.id, "diagnostic")} prefetch={false}>
                      <Stethoscope />
                      Protocole et diagnostic complet
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          ) : null}
          {canAssign ? (
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setDialog("assign")}>
                <Link2 />
                Affecter à un véhicule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog("unassign")}>
                <Unlink />
                Désassigner du véhicule
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                <Trash2 />
                Supprimer le tracker
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AssignDialog
        mode="device"
        deviceId={device.id}
        deviceLabel={device.imei}
        organizationId={device.organizationId}
        open={dialog === "assign"}
        onOpenChange={close}
      />
      <UnassignDialog deviceId={device.id} label={device.imei} open={dialog === "unassign"} onOpenChange={close} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={close}
        title={`Supprimer le tracker ${device.imei} ?`}
        description={
          linked
            ? "Le device est d'abord supprimé chez flespi, puis archivé dans SISBM. Un tracker encore monté ne peut pas être supprimé."
            : "Le tracker sera archivé. Un tracker encore monté ne peut pas être supprimé."
        }
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(device.id, {
            onSuccess: () => {
              toast.success("Tracker supprimé", { description: device.imei });
              setDialog(null);
              onDeleted?.();
            },
            onError: (error) => toast.error("Suppression impossible", { description: getErrorMessage(error) }),
          })
        }
      />
    </>
  );
}
