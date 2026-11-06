"use client";

import { useState } from "react";

import Link from "next/link";

import { Eye, MoreVertical, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteSchedule, useUpdateSchedule } from "@/hooks/api/use-schedules";
import { getErrorMessage } from "@/lib/axios";
import type { UsageSchedule } from "@/types/schedule";

import { ScheduleFormDialog } from "./schedule-form-dialog";

export function ScheduleRowActions({
  schedule,
  showView = true,
  onDeleted,
}: {
  schedule: UsageSchedule;
  showView?: boolean;
  onDeleted?: () => void;
}) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const update = useUpdateSchedule();
  const remove = useDeleteSchedule();

  function toggleActive() {
    update.mutate(
      { id: schedule.id, payload: { isActive: !schedule.isActive } },
      {
        onSuccess: () =>
          toast.success(schedule.isActive ? "Calendrier désactivé" : "Calendrier activé", {
            description: schedule.isActive
              ? `${schedule.name} est ignoré par le moteur à partir du prochain passage.`
              : `${schedule.name} est appliqué à partir du prochain passage du moteur.`,
          }),
        onError: (error) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${schedule.name}`}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-52" align="end">
          <DropdownMenuGroup>
            {showView ? (
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clock/${schedule.id}`} prefetch={false}>
                  <Eye />
                  Voir le détail
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={() => setDialog("edit")}>
              <Pencil />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleActive} disabled={update.isPending}>
              {schedule.isActive ? <Pause /> : <Play />}
              {schedule.isActive ? "Désactiver" : "Activer"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ScheduleFormDialog schedule={schedule} open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Supprimer ${schedule.name} ?`}
        description="Le moteur cesse de l'appliquer au prochain passage : les véhicules qu'il avait immobilisés sont rétablis (s'ils ne relèvent d'aucun autre calendrier). Ceux qu'un opérateur a coupés restent coupés."
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(schedule.id, {
            onSuccess: () => {
              toast.success("Calendrier supprimé", { description: schedule.name });
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
