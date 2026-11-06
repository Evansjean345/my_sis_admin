"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OrganizationSelect } from "@/app/(main)/dashboard/_components/organization/organization-select";
import { vehicleStatusMeta, vehicleTypeLabels } from "@/components/status-labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateVehicle, useUpdateVehicle } from "@/hooks/api/use-vehicles";
import { getErrorMessage } from "@/lib/axios";
import { toNumber } from "@/lib/format";
import {
  type CreateVehiclePayload,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  type Vehicle,
  type VehicleStatus,
  type VehicleType,
} from "@/types/vehicle";

const optionalInt = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+(\.\d+)?$/.test(v) && Number(v) >= min && Number(v) <= max), {
      message: `${label} : entre ${min} et ${max}.`,
    });

const schema = z.object({
  /** Organisation propriétaire : exigée à la création, figée ensuite. */
  organizationId: z.string().min(1, { message: "Choisir l'organisation propriétaire." }),
  registration: z.string().trim().min(3, { message: "3 caractères minimum." }).max(20),
  label: z.string().trim().max(80),
  brand: z.string().trim().max(40),
  model: z.string().trim().max(40),
  year: optionalInt(1950, 2100, "Année"),
  vehicleType: z.enum(VEHICLE_TYPES),
  color: z.string().trim().max(30),
  status: z.enum(VEHICLE_STATUSES),
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-HJ-NPR-Z0-9]{11,17}$/.test(v), {
      message: "VIN invalide (11 à 17 caractères).",
    }),
  odometerKm: optionalInt(0, 10_000_000, "Kilométrage"),
  speedLimitKph: optionalInt(1, 300, "Vitesse"),
  immobilizationEnabled: z.boolean(),
  notes: z.string().trim().max(500),
});

type Values = z.infer<typeof schema>;

function toDefaults(vehicle?: Vehicle, organizationId?: string): Values {
  return {
    organizationId: vehicle?.organizationId ?? organizationId ?? "",
    registration: vehicle?.registration ?? "",
    label: vehicle?.label ?? "",
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    year: vehicle?.year ? String(vehicle.year) : "",
    vehicleType: vehicle?.vehicleType ?? "car",
    color: vehicle?.color ?? "",
    status: vehicle?.status ?? "active",
    vin: vehicle?.vin ?? "",
    odometerKm: vehicle ? String(toNumber(vehicle.odometerKm) ?? "") : "",
    speedLimitKph: vehicle ? String(toNumber(vehicle.speedLimitKph) ?? "") : "90",
    immobilizationEnabled: vehicle?.immobilizationEnabled ?? true,
    notes: vehicle?.notes ?? "",
  };
}

function toPayload(values: Values): CreateVehiclePayload {
  const opt = (v: string) => (v === "" ? undefined : v);
  const num = (v: string) => (v === "" ? undefined : Number(v));
  return {
    organizationId: values.organizationId,
    registration: values.registration,
    label: opt(values.label),
    brand: opt(values.brand),
    model: opt(values.model),
    year: num(values.year),
    vehicleType: values.vehicleType,
    color: opt(values.color),
    status: values.status,
    vin: opt(values.vin),
    odometerKm: num(values.odometerKm),
    speedLimitKph: num(values.speedLimitKph),
    immobilizationEnabled: values.immobilizationEnabled,
    notes: opt(values.notes),
  };
}

const TEXT_FIELDS: Array<{
  name: keyof Values;
  label: string;
  placeholder?: string;
  inputMode?: "numeric";
}> = [
  { name: "brand", label: "Marque", placeholder: "Toyota" },
  { name: "model", label: "Modèle", placeholder: "Land Cruiser" },
  { name: "year", label: "Année", placeholder: "2022", inputMode: "numeric" },
  { name: "color", label: "Couleur", placeholder: "Blanc" },
  {
    name: "odometerKm",
    label: "Kilométrage (km)",
    placeholder: "0",
    inputMode: "numeric",
  },
  {
    name: "speedLimitKph",
    label: "Limite de vitesse (km/h)",
    placeholder: "90",
    inputMode: "numeric",
  },
];

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  defaultOrganizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent = création. */
  vehicle?: Vehicle;
  /** Organisation présélectionnée à la création (ex. filtre de la liste). */
  defaultOrganizationId?: string;
}) {
  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const pending = create.isPending || update.isPending;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(vehicle, defaultOrganizationId),
  });

  useEffect(() => {
    if (open) form.reset(toDefaults(vehicle, defaultOrganizationId));
  }, [open, vehicle, defaultOrganizationId, form]);

  function onSubmit(values: Values) {
    const payload = toPayload(values);
    const handlers = {
      onSuccess: () => {
        toast.success(vehicle ? "Véhicule mis à jour" : "Véhicule créé", {
          description: values.registration,
        });
        onOpenChange(false);
      },
      onError: (error: unknown) =>
        toast.error(vehicle ? "Mise à jour impossible" : "Création impossible", {
          description: getErrorMessage(error),
        }),
    };
    if (vehicle) {
      const { vin: _vin, organizationId: _org, ...rest } = payload;
      update.mutate({ id: vehicle.id, payload: rest }, handlers);
    } else {
      create.mutate(payload, handlers);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vehicle ? `Modifier ${vehicle.registration}` : "Nouveau véhicule"}</DialogTitle>
          <DialogDescription>
            La limite de vitesse est propre au véhicule : un dépassement déclenche une alerte.
          </DialogDescription>
        </DialogHeader>

        <form id="vehicle-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="vehicle-organization">Organisation</FieldLabel>
                  <OrganizationSelect
                    id="vehicle-organization"
                    value={field.value || undefined}
                    onChange={(id) => field.onChange(id ?? "")}
                    invalid={fieldState.invalid}
                    disabled={Boolean(vehicle)}
                  />
                  {vehicle ? <FieldDescription>Un véhicule ne change pas d'organisation.</FieldDescription> : null}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="registration"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vehicle-registration">Immatriculation</FieldLabel>
                    <Input
                      {...field}
                      id="vehicle-registration"
                      placeholder="4355 ZD 01"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="label"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vehicle-label">Libellé</FieldLabel>
                    <Input {...field} id="vehicle-label" placeholder="Camion citerne n°3" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {TEXT_FIELDS.map((f) => (
                <Controller
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`vehicle-${f.name}`}>{f.label}</FieldLabel>
                      <Input
                        {...field}
                        value={String(field.value ?? "")}
                        id={`vehicle-${f.name}`}
                        placeholder={f.placeholder}
                        inputMode={f.inputMode}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="vehicle-type">Type</FieldLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as VehicleType)}>
                      <SelectTrigger id="vehicle-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {VEHICLE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {vehicleTypeLabels[t]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="vehicle-status">Statut</FieldLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as VehicleStatus)}>
                      <SelectTrigger id="vehicle-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {VEHICLE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {vehicleStatusMeta[s].label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="vin"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="vehicle-vin">VIN</FieldLabel>
                    <Input
                      {...field}
                      id="vehicle-vin"
                      disabled={Boolean(vehicle)}
                      placeholder="Optionnel"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="immobilizationEnabled"
              render={({ field }) => (
                <Field orientation="horizontal" className="rounded-lg border p-3">
                  <FieldContent>
                    <FieldLabel htmlFor="vehicle-immobilization">Immobilisation autorisée</FieldLabel>
                    <FieldDescription>
                      Permet la coupure carburant à distance (garde-fou de vitesse appliqué).
                    </FieldDescription>
                  </FieldContent>
                  <Switch id="vehicle-immobilization" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="vehicle-notes">Notes</FieldLabel>
                  <Textarea {...field} id="vehicle-notes" placeholder="Informations complémentaires" />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="vehicle-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {vehicle ? "Enregistrer" : "Créer le véhicule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
