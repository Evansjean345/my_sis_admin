"use client";

import { useEffect, useState } from "react";

import { Gauge } from "lucide-react";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@shared/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@shared/components/ui/input-group";
import { Slider } from "@shared/components/ui/slider";
import { Spinner } from "@shared/components/ui/spinner";
import { useUpdateVehicle } from "@shared/hooks/api/use-vehicles";
import { getErrorMessage } from "@shared/lib/axios";
import { toNumber } from "@shared/lib/format";
import type { Vehicle } from "@shared/types/vehicle";

export function SpeedLimitDialog({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: Vehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateVehicle();
  const [value, setValue] = useState(90);

  useEffect(() => {
    if (open) setValue(toNumber(vehicle.speedLimitKph) ?? 90);
  }, [open, vehicle]);

  const invalid = !Number.isFinite(value) || value < 1 || value > 300;

  function submit() {
    if (invalid) return;
    update.mutate(
      { id: vehicle.id, payload: { speedLimitKph: Math.round(value) } },
      {
        onSuccess: () => {
          toast.success("Limite de vitesse mise à jour", {
            description: `${vehicle.registration} : ${Math.round(value)} km/h`,
          });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Mise à jour impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gauge className="size-4" />
            Limite de vitesse
          </DialogTitle>
          <DialogDescription>{vehicle.registration}</DialogDescription>
        </DialogHeader>
        <Field className="gap-3" data-invalid={invalid}>
          <FieldLabel htmlFor="speed-limit">Seuil d'alerte</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="speed-limit"
              type="number"
              min={1}
              max={300}
              value={Number.isFinite(value) ? value : ""}
              onChange={(e) => setValue(Number(e.target.value))}
              aria-invalid={invalid}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>km/h</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <Slider
            min={10}
            max={200}
            step={5}
            value={[Math.min(Math.max(value, 10), 200)]}
            onValueChange={([v]) => setValue(v)}
          />
          <FieldDescription>Un dépassement déclenche une alerte ; il ne coupe pas le moteur.</FieldDescription>
          {invalid ? <FieldError>Valeur entre 1 et 300 km/h.</FieldError> : null}
        </Field>
        <DialogFooter>
          <Button variant="outline" disabled={update.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={update.isPending || invalid}>
            {update.isPending ? <Spinner data-icon="inline-start" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
