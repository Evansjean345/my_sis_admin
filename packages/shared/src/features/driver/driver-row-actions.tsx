"use client";

import { useState } from "react";

import Link from "next/link";

import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { DriverFormDialog } from "@shared/features/driver/driver-form-dialog";
import { useDeleteDriver } from "@shared/hooks/api/use-drivers";
import { getErrorMessage } from "@shared/lib/axios";
import type { Driver } from "@shared/types/driver";

export function DriverRowActions({
  driver,
  showView = true,
  onDeleted,
}: {
  driver: Driver;
  showView?: boolean;
  onDeleted?: () => void;
}) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const remove = useDeleteDriver();

  // Consultation seule (opérateur, niveau 3) : un lien vers la fiche, sans menu d'édition.
  const canWrite = useOptionalAccess()?.can("vehicle:write") ?? false;
  if (!canWrite) {
    return showView ? (
      <Button asChild variant="ghost" size="icon-sm" aria-label={`Voir ${driver.fullName}`}>
        <Link href={`/dashboard/driver/${driver.id}`} prefetch={false}>
          <Eye />
        </Link>
      </Button>
    ) : null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${driver.fullName}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="end">
          <DropdownMenuGroup>
            {showView ? (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/driver/${driver.id}`} prefetch={false}>
                  <Eye />
                  Voir la fiche
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <Pencil />
              Modifier
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 />
            Supprimer le conducteur
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DriverFormDialog driver={driver} open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Supprimer ${driver.fullName} ?`}
        description="Suppression logique : le conducteur est détaché de son véhicule et sort des listes, mais reste lisible dans le journal d'audit."
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(driver.id, {
            onSuccess: () => {
              toast.success("Conducteur supprimé", { description: driver.fullName });
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
