"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Link2, Truck, Unlink } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { Can } from "@shared/components/providers/access-provider";
import { EmptyState } from "@shared/components/query-state";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@shared/components/ui/field";
import { Spinner } from "@shared/components/ui/spinner";
import { DriverVehicleSelect } from "@shared/features/driver/driver-selects";
import { useAssignDriverVehicle } from "@shared/hooks/api/use-drivers";
import { getErrorMessage } from "@shared/lib/axios";
import type { DriverDetail } from "@shared/types/driver";

/** Véhicule conduit : rattachement, changement, détachement (audités avant / après côté API). */
export function DriverVehicleCard({ driver }: { driver: DriverDetail }) {
  const [dialog, setDialog] = useState<"assign" | "detach" | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(driver.vehicleId);
  const assign = useAssignDriverVehicle();

  useEffect(() => {
    if (dialog === "assign") setVehicleId(driver.vehicleId);
  }, [dialog, driver.vehicleId]);

  function submit(id: string | null) {
    assign.mutate(
      { id: driver.id, vehicleId: id },
      {
        onSuccess: (updated) => {
          toast.success(id ? "Véhicule rattaché" : "Véhicule détaché", {
            description: updated.vehicle?.registration ?? driver.fullName,
          });
          setDialog(null);
        },
        onError: (error) => toast.error("Opération impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Véhicule</CardTitle>
        <CardDescription>Plusieurs conducteurs peuvent partager un véhicule (équipes).</CardDescription>
        <CardAction className="flex gap-2">
          <Can permission="vehicle:write">
            {driver.vehicle ? (
              <Button size="sm" variant="outline" onClick={() => setDialog("detach")}>
                <Unlink data-icon="inline-start" />
                Détacher
              </Button>
            ) : null}
            <Button size="sm" variant={driver.vehicle ? "outline" : "default"} onClick={() => setDialog("assign")}>
              <Link2 data-icon="inline-start" />
              {driver.vehicle ? "Changer" : "Rattacher"}
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent>
        {driver.vehicle ? (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Truck className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col">
              <Link
                href={`/dashboard/vehicles/${driver.vehicle.id}`}
                prefetch={false}
                className="truncate font-medium text-sm hover:underline"
              >
                {driver.vehicle.registration}
              </Link>
              <span className="truncate text-muted-foreground text-xs">{driver.vehicle.label ?? "—"}</span>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Truck />}
            title="Aucun véhicule"
            description="Ce conducteur n'est rattaché à aucun véhicule."
          />
        )}
      </CardContent>

      <Dialog open={dialog === "assign"} onOpenChange={(o) => !assign.isPending && !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rattacher un véhicule</DialogTitle>
            <DialogDescription>{driver.fullName}</DialogDescription>
          </DialogHeader>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="driver-assign-vehicle">Véhicule</FieldLabel>
            <DriverVehicleSelect
              id="driver-assign-vehicle"
              organizationId={driver.organizationId}
              value={vehicleId}
              onChange={setVehicleId}
            />
            <FieldDescription>
              {driver.organizationId
                ? "Seuls les véhicules de son organisation sont proposés."
                : "Conducteur du vivier : tout véhicule peut lui être rattaché."}
            </FieldDescription>
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={assign.isPending} onClick={() => setDialog(null)}>
              Annuler
            </Button>
            <Button disabled={vehicleId === driver.vehicleId || assign.isPending} onClick={() => submit(vehicleId)}>
              {assign.isPending ? <Spinner data-icon="inline-start" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={dialog === "detach"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Détacher ${driver.vehicle?.registration ?? "le véhicule"} ?`}
        description="Le conducteur reste dans son organisation et ses équipes."
        confirmLabel="Détacher"
        loading={assign.isPending}
        onConfirm={() => submit(null)}
      />
    </Card>
  );
}
