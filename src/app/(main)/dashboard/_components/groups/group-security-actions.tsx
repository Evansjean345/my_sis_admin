"use client";

import { useState } from "react";

import Link from "next/link";

import { Fuel, PowerOff } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImmobilizeGroup, useRestoreGroup } from "@/hooks/api/use-commands";
import type { GroupCommandResult } from "@/types/command";

import { CommandDialog } from "../commands/command-dialog";
import { notifyCommandError } from "../commands/command-feedback";

/**
 * Coupure / rétablissement IMMÉDIAT de toute une flotte. Chaque véhicule
 * passe par les mêmes garde-fous qu'une commande unitaire (vitesse,
 * fraîcheur de position, une commande en vol par boîtier) : le résultat
 * est donc donné véhicule par véhicule.
 */
export function GroupSecurityActions({
  groupId,
  groupName,
  membersCount,
}: {
  groupId: string;
  groupName: string;
  membersCount: number;
}) {
  const [dialog, setDialog] = useState<"cut" | "restore" | null>(null);
  const [report, setReport] = useState<GroupCommandResult | null>(null);
  const immobilize = useImmobilizeGroup();
  const restore = useRestoreGroup();

  function handle(action: "cut" | "restore", reason: string) {
    const mutation = action === "cut" ? immobilize : restore;
    const label = action === "cut" ? "Immobilisation de la flotte" : "Rétablissement de la flotte";
    mutation.mutate(
      { groupId, reason },
      {
        onSuccess: (result) => {
          setDialog(null);
          if (result.failed === 0) {
            toast.success(`${label} : ${result.succeeded}/${result.total} commande(s) émise(s)`);
          } else {
            toast.warning(`${label} : ${result.failed} véhicule(s) refusé(s)`, {
              description: `${result.succeeded} commande(s) émise(s) sur ${result.total}.`,
            });
          }
          setReport(result);
        },
        onError: (error) => notifyCommandError(label, error),
      },
    );
  }

  const empty = membersCount === 0;

  return (
    <>
      <Button size="sm" variant="destructive" disabled={empty} onClick={() => setDialog("cut")}>
        <PowerOff data-icon="inline-start" />
        Immobiliser la flotte
      </Button>
      <Button size="sm" variant="outline" disabled={empty} onClick={() => setDialog("restore")}>
        <Fuel data-icon="inline-start" />
        Rétablir la flotte
      </Button>

      <CommandDialog
        open={dialog === "cut"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Immobiliser ${groupName}`}
        description={`Coupure moteur (S20 1,1) envoyée à chacun des ${membersCount} véhicule(s) de la flotte.`}
        warning="Les véhicules en mouvement ou sans position récente sont refusés un par un. Une coupure manuelle n'est jamais levée par un calendrier."
        confirmLabel="Immobiliser la flotte"
        destructive
        pending={immobilize.isPending}
        onSubmit={({ reason }) => handle("cut", reason)}
      />

      <CommandDialog
        open={dialog === "restore"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Rétablir ${groupName}`}
        description={`Rétablissement (S20 0,0) envoyé à chacun des ${membersCount} véhicule(s). Un calendrier actif pourra recouper un véhicule hors de ses plages.`}
        confirmLabel="Rétablir la flotte"
        pending={restore.isPending}
        onSubmit={({ reason }) => handle("restore", reason)}
      />

      <Dialog open={Boolean(report)} onOpenChange={(open) => !open && setReport(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{report?.action === "cut" ? "Immobilisation" : "Rétablissement"} — résultat</DialogTitle>
            <DialogDescription>
              {report
                ? `${report.succeeded} émise(s), ${report.failed} refusée(s) sur ${report.total} véhicule(s).`
                : null}
            </DialogDescription>
          </DialogHeader>
          <ul className="flex max-h-80 flex-col divide-y overflow-y-auto">
            {report?.results.map((r) => (
              <li key={r.vehicleId} className="flex items-start justify-between gap-3 py-2">
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`/dashboard/vehicles/${r.vehicleId}`}
                    prefetch={false}
                    className="font-medium font-mono text-sm hover:underline"
                  >
                    {r.registration}
                  </Link>
                  {r.error ? <span className="text-muted-foreground text-xs">{r.error.message}</span> : null}
                </div>
                <StatusBadge tone={r.ok ? "success" : "danger"}>{r.ok ? "Émise" : "Refusée"}</StatusBadge>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReport(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
