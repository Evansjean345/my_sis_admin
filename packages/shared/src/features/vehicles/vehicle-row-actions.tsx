"use client";

import { useState } from "react";

import Link from "next/link";

import { Eye, Gauge, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { SpeedLimitDialog } from "@shared/features/vehicles/speed-limit-dialog";
import { VehicleFormDialog } from "@shared/features/vehicles/vehicle-form-dialog";
import { useDeleteVehicle } from "@shared/hooks/api/use-vehicles";
import { getErrorMessage } from "@shared/lib/axios";
import type { Vehicle } from "@shared/types/vehicle";

export function VehicleRowActions({
  vehicle,
  onDeleted,
  showView = true,
}: {
  vehicle: Vehicle;
  onDeleted?: () => void;
  showView?: boolean;
}) {
  const [dialog, setDialog] = useState<"edit" | "speed" | "delete" | null>(null);
  const remove = useDeleteVehicle();

  // Consultation seule (opérateur, niveau 3) : un lien vers la fiche, sans menu d'édition.
  const canWrite = useOptionalAccess()?.can("vehicle:write") ?? false;
  if (!canWrite) {
    return showView ? (
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Voir ${vehicle.registration}`}>
        <Link href={`/dashboard/vehicles/${vehicle.id}`} prefetch={false}>
          <Eye />
        </Link>
      </Button>
    ) : null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${vehicle.registration}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="end">
          <DropdownMenuGroup>
            {showView ? (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/vehicles/${vehicle.id}`} prefetch={false}>
                  <Eye />
                  Voir le détail
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <Pencil />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDialog("speed")}>
              <Gauge />
              Limite de vitesse
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 />
            Archiver le véhicule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <VehicleFormDialog vehicle={vehicle} open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} />
      <SpeedLimitDialog vehicle={vehicle} open={dialog === "speed"} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Archiver ${vehicle.registration} ?`}
        description="Suppression logique : le véhicule n'apparaîtra plus dans la flotte. Démontez son tracker au préalable."
        confirmLabel="Archiver"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(vehicle.id, {
            onSuccess: () => {
              toast.success("Véhicule archivé", { description: vehicle.registration });
              setDialog(null);
              onDeleted?.();
            },
            onError: (error) => toast.error("Archivage impossible", { description: getErrorMessage(error) }),
          })
        }
      />
    </>
  );
}
