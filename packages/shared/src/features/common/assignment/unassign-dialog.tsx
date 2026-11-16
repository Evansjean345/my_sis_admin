"use client";

import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { useUnassignDevice } from "@shared/hooks/api/use-devices";
import { getErrorMessage } from "@shared/lib/axios";

export function UnassignDialog({
  deviceId,
  label,
  open,
  onOpenChange,
}: {
  deviceId: string;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const unassign = useUnassignDevice();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Démonter le tracker ?"
      description={`${label} — l'affectation en cours sera clôturée à la date d'aujourd'hui. Les positions ne seront plus rattachées au véhicule.`}
      confirmLabel="Démonter"
      destructive
      loading={unassign.isPending}
      onConfirm={() =>
        unassign.mutate(deviceId, {
          onSuccess: () => {
            toast.success("Tracker démonté");
            onOpenChange(false);
          },
          onError: (error) => toast.error("Démontage impossible", { description: getErrorMessage(error) }),
        })
      }
    />
  );
}
