"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { deviceStatusMeta } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { Switch } from "@shared/components/ui/switch";
import { Textarea } from "@shared/components/ui/textarea";
import { useUpdateDevice } from "@shared/hooks/api/use-devices";
import { getErrorMessage } from "@shared/lib/axios";
import { DEVICE_STATUSES, type Device, type DeviceStatus, type UpdateDevicePayload } from "@shared/types/device";

const schema = z.object({
  name: z.string().trim().max(255),
  model: z.string().trim().min(2).max(40),
  serialNumber: z.string().trim().max(40),
  simMsisdn: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+[1-9]\d{7,14}$/.test(v), { message: "Format international : +2250700000000" }),
  simOperator: z.string().trim().max(40),
  flespiIdent: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9A-Za-z]{4,30}$/.test(v), { message: "4 à 30 caractères alphanumériques." }),
  status: z.enum(DEVICE_STATUSES),
  hasRelay: z.boolean(),
  notes: z.string().trim().max(500),
});

type Values = z.infer<typeof schema>;

const TEXT_FIELDS: Array<{
  name: "name" | "model" | "serialNumber" | "simMsisdn" | "simOperator" | "flespiIdent";
  label: string;
  hint?: string;
}> = [
  { name: "name", label: "Nom affiché (flespi)", hint: "Laisser vide pour ne pas le modifier." },
  { name: "model", label: "Modèle" },
  { name: "serialNumber", label: "Numéro de série" },
  { name: "simMsisdn", label: "Numéro SIM", hint: "Répercuté chez flespi." },
  { name: "simOperator", label: "Opérateur SIM" },
  { name: "flespiIdent", label: "Ident flespi", hint: "Le boîtier doit émettre le nouvel ident." },
];

export function DeviceEditDialog({
  device,
  open,
  onOpenChange,
}: {
  device: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateDevice();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        model: device.model,
        serialNumber: device.serialNumber ?? "",
        simMsisdn: device.simMsisdn ?? "",
        simOperator: device.simOperator ?? "",
        flespiIdent: device.flespiIdent ?? "",
        status: device.status,
        hasRelay: device.hasRelay,
        notes: device.notes ?? "",
      });
    }
  }, [open, device, form]);

  function onSubmit(v: Values) {
    // N'envoie que les champs modifiés (le nom et l'ident sont répercutés chez flespi).
    const payload: UpdateDevicePayload = {};
    if (v.name) payload.name = v.name;
    if (v.model !== device.model) payload.model = v.model;
    if (v.serialNumber && v.serialNumber !== (device.serialNumber ?? "")) payload.serialNumber = v.serialNumber;
    if (v.simMsisdn && v.simMsisdn !== (device.simMsisdn ?? "")) payload.simMsisdn = v.simMsisdn;
    if (v.simOperator && v.simOperator !== (device.simOperator ?? "")) payload.simOperator = v.simOperator;
    if (v.flespiIdent && v.flespiIdent !== (device.flespiIdent ?? "")) payload.flespiIdent = v.flespiIdent;
    if (v.status !== device.status) payload.status = v.status;
    if (v.hasRelay !== device.hasRelay) payload.hasRelay = v.hasRelay;
    if (v.notes !== (device.notes ?? "")) payload.notes = v.notes;

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }
    update.mutate(
      { id: device.id, payload },
      {
        onSuccess: () => {
          toast.success("Tracker mis à jour", { description: device.imei });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Mise à jour impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le tracker</DialogTitle>
          <DialogDescription className="font-mono">{device.imei}</DialogDescription>
        </DialogHeader>
        <form id="device-edit-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map((f) => (
                <Controller
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`device-edit-${f.name}`}>{f.label}</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id={`device-edit-${f.name}`}
                        aria-invalid={fieldState.invalid}
                      />
                      {f.hint ? <FieldDescription>{f.hint}</FieldDescription> : null}
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="device-edit-status">Statut</FieldLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as DeviceStatus)}>
                      <SelectTrigger id="device-edit-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {DEVICE_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {deviceStatusMeta[s].label}
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
                name="hasRelay"
                render={({ field }) => (
                  <Field orientation="horizontal" className="self-end rounded-lg border p-2.5">
                    <FieldContent>
                      <FieldLabel htmlFor="device-edit-relay">Relais de coupure</FieldLabel>
                    </FieldContent>
                    <Switch id="device-edit-relay" checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="device-edit-notes">Notes</FieldLabel>
                  <Textarea {...field} value={field.value ?? ""} id="device-edit-notes" />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={update.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="device-edit-form" disabled={update.isPending}>
            {update.isPending ? <Spinner data-icon="inline-start" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
