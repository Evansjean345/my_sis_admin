"use client";

import { useEffect, useState } from "react";

import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { Textarea } from "@shared/components/ui/textarea";
import { useAssignDevice, useDevices } from "@shared/hooks/api/use-devices";
import { useVehicles } from "@shared/hooks/api/use-vehicles";
import { getErrorMessage } from "@shared/lib/axios";

type AssignDialogProps = (
  | { mode: "device"; deviceId: string; deviceLabel: string; vehicleId?: never; vehicleLabel?: never }
  | { mode: "vehicle"; vehicleId: string; vehicleLabel: string; deviceId?: never; deviceLabel?: never }
) & {
  /**
   * Organisation de la ressource de départ. Le montage exige un véhicule et un
   * tracker de la MÊME organisation : les candidats sont filtrés dessus.
   */
  organizationId: string;
};

/**
 * Montage DATÉ d'un tracker sur un véhicule (POST /devices/:id/assignment).
 * - mode « device » : on choisit le véhicule ;
 * - mode « vehicle » : on choisit un tracker en stock, non monté.
 */
export function AssignDialog({
  open,
  onOpenChange,
  ...props
}: AssignDialogProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selected, setSelected] = useState("");
  const [notes, setNotes] = useState("");
  const assign = useAssignDevice();

  const organizationId = props.organizationId;
  const vehicles = useVehicles(
    { perPage: 100, status: "active", organizationId },
    { enabled: open && props.mode === "device" },
  );
  const devices = useDevices(
    { perPage: 100, unassigned: true, organizationId },
    { enabled: open && props.mode === "vehicle" },
  );

  useEffect(() => {
    if (open) {
      setSelected("");
      setNotes("");
    }
  }, [open]);

  const options =
    props.mode === "device"
      ? (vehicles.data?.data ?? []).map((v) => ({
          value: v.id,
          label: `${v.registration}${v.brand ? ` · ${v.brand} ${v.model ?? ""}` : ""}`,
        }))
      : (devices.data?.data ?? []).map((d) => ({ value: d.id, label: `${d.imei} · ${d.model}` }));
  const loading = props.mode === "device" ? vehicles.isPending : devices.isPending;

  function submit() {
    if (!selected) return;
    const deviceId = props.mode === "device" ? props.deviceId : selected;
    const vehicleId = props.mode === "device" ? selected : props.vehicleId;
    assign.mutate(
      { id: deviceId, payload: { vehicleId, installNotes: notes.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success("Tracker monté sur le véhicule");
          onOpenChange(false);
        },
        onError: (error) => toast.error("Montage impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !assign.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4" />
            {props.mode === "device" ? "Affecter à un véhicule" : "Monter un tracker"}
          </DialogTitle>
          <DialogDescription>
            {props.mode === "device" ? `Tracker ${props.deviceLabel}` : `Véhicule ${props.vehicleLabel}`}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="assign-target">{props.mode === "device" ? "Véhicule" : "Tracker en stock"}</FieldLabel>
            <Select value={selected} onValueChange={setSelected} disabled={loading}>
              <SelectTrigger id="assign-target" className="w-full">
                <SelectValue placeholder={loading ? "Chargement…" : "Sélectionner"} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {options.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Aucun élément disponible
                    </SelectItem>
                  ) : (
                    options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              {props.mode === "device"
                ? "Si le tracker est déjà monté ailleurs, l'affectation en cours est clôturée."
                : "Seuls les trackers non montés sont proposés."}
            </FieldDescription>
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="assign-notes">Notes d'installation</FieldLabel>
            <Textarea
              id="assign-notes"
              maxLength={300}
              placeholder="Installation atelier Abidjan"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" disabled={assign.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={!selected || assign.isPending}>
            {assign.isPending ? <Spinner data-icon="inline-start" /> : null}
            Monter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
