"use client";

import { useEffect, useState } from "react";

import { ArrowRightLeft, Building2, LogOut, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { OrganizationSelect } from "@/app/(main)/dashboard/_components/organization/organization-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/query-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAssignDriverOrganization, useRemoveDriverOrganization } from "@/hooks/api/use-drivers";
import { useOrganizationLabel } from "@/hooks/api/use-organizations";
import { getErrorMessage } from "@/lib/axios";
import type { DriverDetail, DriverOrganizationChange } from "@/types/driver";

/** Toast unique : annonce les effets du changement renvoyés par l'API. */
function notifyChange(title: string, result: DriverOrganizationChange) {
  const effets: string[] = [];
  if (result.vehicleDetached) effets.push("véhicule retiré");
  if (result.groupsLeft > 0) effets.push(`${result.groupsLeft} équipe(s) quittée(s)`);
  toast.success(title, {
    description: result.unchanged ? "Aucun changement." : effets.length ? effets.join(" · ") : result.fullName,
  });
}

/**
 * ORGANISATION du conducteur : l'ajouter, le DÉPLACER vers une autre, ou
 * l'en retirer (retour au vivier). Réservé à l'exploitant (`/admin/*`).
 *
 * Effets appliqués par l'API et annoncés ici AVANT confirmation :
 *   - le véhicule est retiré s'il n'appartient pas à l'organisation d'arrivée
 *     (toujours lors d'un retrait) ;
 *   - le conducteur quitte les équipes de l'organisation quittée.
 */
export function DriverOrganizationCard({ driver }: { driver: DriverDetail }) {
  const [dialog, setDialog] = useState<"assign" | "remove" | null>(null);
  const [cible, setCible] = useState<string | undefined>();
  const assign = useAssignDriverOrganization();
  const remove = useRemoveDriverOrganization();

  useEffect(() => {
    if (dialog === "assign") setCible(undefined);
  }, [dialog]);

  const aOrganisation = Boolean(driver.organizationId);
  const organization = useOrganizationLabel(driver.organizationId, driver.organization);
  const deplacement = aOrganisation && cible !== undefined && cible !== driver.organizationId;

  function submitAssign() {
    if (!cible) return;
    assign.mutate(
      { id: driver.id, organizationId: cible },
      {
        onSuccess: (result) => {
          notifyChange(deplacement ? "Conducteur déplacé" : "Conducteur rattaché", result);
          setDialog(null);
        },
        onError: (error) => toast.error("Rattachement impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Organisation</CardTitle>
        <CardDescription>
          {aOrganisation
            ? "Le conducteur ne conduit que les véhicules de cette organisation."
            : "Vivier de l'exploitant."}
        </CardDescription>
        <CardAction className="flex gap-2">
          {aOrganisation ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setDialog("assign")}>
                <ArrowRightLeft data-icon="inline-start" />
                Déplacer
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDialog("remove")}>
                <LogOut data-icon="inline-start" />
                Retirer
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setDialog("assign")}>
              <Plus data-icon="inline-start" />
              Rattacher
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {aOrganisation ? (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Building2 className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-sm">{organization?.name ?? "Organisation"}</span>
              <span className="truncate font-mono text-muted-foreground text-xs">
                {organization?.code ?? driver.organizationId}
              </span>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Building2 />}
            title="Sans organisation"
            description="Invisible des comptes clients. Rattachez-le à une organisation pour l'affecter à ses véhicules et à ses équipes."
          />
        )}
      </CardContent>

      <Dialog open={dialog === "assign"} onOpenChange={(o) => !assign.isPending && !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {aOrganisation ? "Déplacer vers une organisation" : "Rattacher à une organisation"}
            </DialogTitle>
            <DialogDescription>{driver.fullName}</DialogDescription>
          </DialogHeader>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="driver-target-organization">Organisation</FieldLabel>
            <OrganizationSelect id="driver-target-organization" value={cible} onChange={setCible} />
          </Field>
          {deplacement || (driver.vehicleId && cible) ? (
            <Alert>
              <TriangleAlert />
              <AlertTitle>Effets du changement</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {driver.vehicleId ? (
                    <li>Son véhicule actuel est retiré s'il n'appartient pas à l'organisation choisie.</li>
                  ) : null}
                  {deplacement && driver.groups.length > 0 ? (
                    <li>Il quitte ses {driver.groups.length} équipe(s) actuelle(s).</li>
                  ) : null}
                  <li>Son permis et son matricule doivent être libres dans l'organisation choisie.</li>
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={assign.isPending} onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button disabled={!cible || cible === driver.organizationId || assign.isPending} onClick={submitAssign}>
              {assign.isPending ? <Spinner data-icon="inline-start" /> : null}
              {aOrganisation ? "Déplacer" : "Rattacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={dialog === "remove"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Retirer ${driver.fullName} de ${organization?.name ?? "son organisation"} ?`}
        description={`Il rejoint le vivier de l'exploitant, invisible des comptes clients.${
          driver.vehicleId ? " Son véhicule lui est retiré." : ""
        }${driver.groups.length ? ` Il quitte ses ${driver.groups.length} équipe(s).` : ""}`}
        confirmLabel="Retirer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(driver.id, {
            onSuccess: (result) => {
              notifyChange("Conducteur retiré de l'organisation", result);
              setDialog(null);
            },
            onError: (error) => toast.error("Retrait impossible", { description: getErrorMessage(error) }),
          })
        }
      />
    </Card>
  );
}
