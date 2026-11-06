"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OrganizationSelect } from "@/app/(main)/dashboard/_components/organization/organization-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDevice } from "@/hooks/api/use-devices";
import { useChannels, useDeviceTypes, useFlespiHealth } from "@/hooks/api/use-flespi";
import { getErrorMessage } from "@/lib/axios";
import { type CreateDevicePayload, DEVICE_MANUFACTURERS, type DeviceManufacturer } from "@/types/device";

const schema = z
  .object({
    /** Organisation propriétaire du boîtier — exigée par POST /admin/devices. */
    organizationId: z.string().min(1, { message: "Choisir l'organisation propriétaire." }),
    imei: z.string().trim().regex(/^\d+$/, { message: "Chiffres uniquement." }),
    terminalId: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{6,20}$/.test(v), {
        message: "6 à 20 chiffres (champ « ID » de l'étiquette).",
      }),
    model: z.string().trim().min(2, { message: "2 caractères minimum." }).max(40),
    manufacturer: z.enum(DEVICE_MANUFACTURERS),
    name: z.string().trim().max(255),
    hasRelay: z.boolean(),
    simMsisdn: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\+[1-9]\d{7,14}$/.test(v), {
        message: "Format international : +2250700000000",
      }),
    simIccid: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{18,22}$/.test(v), {
        message: "18 à 22 chiffres.",
      }),
    syncFlespi: z.boolean(),
    flespiChannelId: z.string(),
    flespiDeviceType: z.string(),
    linkExisting: z.boolean(),
    notes: z.string().trim().max(500),
  })
  .refine((v) => !v.syncFlespi || v.terminalId !== "" || v.manufacturer !== "micodus", {
    message: "Micodus : l'ID de l'étiquette est requis pour calculer l'ident flespi.",
    path: ["terminalId"],
  })
  .refine((v) => !v.syncFlespi || v.flespiChannelId !== "", {
    message: "Choisissez un canal.",
    path: ["flespiChannelId"],
  });

type Values = z.infer<typeof schema>;

const DEFAULTS: Values = {
  organizationId: "",
  imei: "",
  terminalId: "",
  model: "MV730",
  manufacturer: "micodus",
  name: "",
  hasRelay: true,
  simMsisdn: "",
  simIccid: "",
  syncFlespi: true,
  flespiChannelId: "",
  flespiDeviceType: "Micodus MV730",
  linkExisting: false,
  notes: "",
};

function toPayload(v: Values): CreateDevicePayload {
  const opt = (s: string) => (s === "" ? undefined : s);
  return {
    organizationId: v.organizationId,
    imei: v.imei,
    terminalId: opt(v.terminalId),
    model: v.model,
    manufacturer: v.manufacturer,
    name: opt(v.name),
    hasRelay: v.hasRelay,
    simMsisdn: opt(v.simMsisdn),
    simIccid: opt(v.simIccid),
    notes: opt(v.notes),
    syncFlespi: v.syncFlespi,
    ...(v.syncFlespi
      ? {
          flespiChannelId: Number(v.flespiChannelId),
          flespiDeviceType: opt(v.flespiDeviceType),
          linkExisting: v.linkExisting || undefined,
        }
      : {}),
  };
}

const TEXT_FIELDS: Array<{
  name: "imei" | "terminalId" | "model" | "name" | "simMsisdn" | "simIccid";
  label: string;
  placeholder: string;
  hint?: string;
}> = [
  { name: "imei", label: "IMEI", placeholder: "864356060535359" },
  {
    name: "terminalId",
    label: "ID terminal (étiquette)",
    placeholder: "7301151405",
    hint: "Micodus : Identifiant derrière le boitier",
  },
  { name: "model", label: "Modèle", placeholder: "MV730" },
  {
    name: "name",
    label: "Nom affiché (flespi)",
    placeholder: "Véhicule AB-123-CD",
  },
  {
    name: "simMsisdn",
    label: "Numéro SIM",
    placeholder: "+2250576439838",
    hint: "Requis pour les commandes SMS de secours.",
  },
  { name: "simIccid", label: "ICCID SIM", placeholder: "Optionnel" },
];

export function DeviceCreateDialog({
  open,
  onOpenChange,
  defaultOrganizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Organisation présélectionnée (ex. filtre de la liste). */
  defaultOrganizationId?: string;
}) {
  const create = useCreateDevice();
  const channels = useChannels();
  const health = useFlespiHealth();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });
  const syncFlespi = useWatch({ control: form.control, name: "syncFlespi" });
  const deviceTypes = useDeviceTypes(health.data?.protocolName ?? "micodus", undefined, open && syncFlespi);

  const defaultChannel = health.data?.configuredChannelId ?? channels.data?.[0]?.id;

  useEffect(() => {
    if (open) {
      form.reset({ ...DEFAULTS, organizationId: defaultOrganizationId ?? "" });
    }
  }, [open, defaultOrganizationId, form]);

  // Canal par défaut = FLESPI_CHANNEL_ID du serveur, posé dès qu'il est connu (sans écraser la saisie).
  useEffect(() => {
    if (open && defaultChannel && !form.getValues("flespiChannelId")) {
      form.setValue("flespiChannelId", String(defaultChannel));
    }
  }, [open, defaultChannel, form]);

  function onSubmit(values: Values) {
    create.mutate(toPayload(values), {
      onSuccess: (res) => {
        const flespi = res.meta?.flespi;
        toast.success("Tracker enregistré", {
          description: flespi
            ? `Device flespi ${flespi.deviceId} ${flespi.created ? "créé" : "rattaché"} · ident ${flespi.ident}`
            : `IMEI ${res.data.imei} (en stock, non rattaché à flespi)`,
        });
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error("Enregistrement impossible", {
          description: getErrorMessage(error),
        }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau tracker</DialogTitle>
          <DialogDescription>Enregistrez le boîtier dans SISBM et, si besoin, créez-le chez flespi.</DialogDescription>
        </DialogHeader>

        <form id="device-create-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="device-organization">Organisation</FieldLabel>
                  <OrganizationSelect
                    id="device-organization"
                    value={field.value || undefined}
                    onChange={(id) => field.onChange(id ?? "")}
                    invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {TEXT_FIELDS.map((f) => (
                <Controller
                  key={f.name}
                  control={form.control}
                  name={f.name}
                  render={({ field, fieldState }) => (
                    <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`device-${f.name}`}>{f.label}</FieldLabel>
                      <Input
                        {...field}
                        id={`device-${f.name}`}
                        placeholder={f.placeholder}
                        autoComplete="off"
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
                name="manufacturer"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="device-manufacturer">Fabricant</FieldLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as DeviceManufacturer)}>
                      <SelectTrigger id="device-manufacturer" className="w-full capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {DEVICE_MANUFACTURERS.map((m) => (
                            <SelectItem key={m} value={m} className="capitalize">
                              {m}
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
                      <FieldLabel htmlFor="device-relay">Relais de coupure</FieldLabel>
                    </FieldContent>
                    <Switch id="device-relay" checked={field.value} onCheckedChange={field.onChange} />
                  </Field>
                )}
              />
            </div>

            <FieldSeparator />

            <Controller
              control={form.control}
              name="syncFlespi"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="device-sync">Synchroniser avec flespi</FieldLabel>
                    <FieldDescription>
                      Crée le device sur le canal choisi. Sans synchronisation, le tracker reste en stock.
                    </FieldDescription>
                  </FieldContent>
                  <Switch id="device-sync" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />

            {syncFlespi ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="flespiChannelId"
                    render={({ field, fieldState }) => (
                      <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="device-channel">Canal flespi</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={channels.isPending}>
                          <SelectTrigger id="device-channel" className="w-full" aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder={channels.isPending ? "Chargement…" : "Choisir un canal"} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectGroup>
                              {(channels.data ?? []).map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name} · {c.id}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="flespiDeviceType"
                    render={({ field }) => (
                      <Field className="gap-1.5">
                        <FieldLabel htmlFor="device-type">Type de boîtier flespi</FieldLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={deviceTypes.isPending}>
                          <SelectTrigger id="device-type" className="w-full">
                            <SelectValue placeholder="Micodus MV730" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-72">
                            <SelectGroup>
                              {(
                                deviceTypes.data?.deviceTypes ?? [
                                  {
                                    id: 1198,
                                    title: "Micodus MV730",
                                    name: "mv730",
                                    protocol_id: 325,
                                  },
                                ]
                              ).map((t) => (
                                <SelectItem key={t.id} value={t.title}>
                                  {t.title}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription>Doit appartenir au protocole du canal.</FieldDescription>
                      </Field>
                    )}
                  />
                </div>
                <Controller
                  control={form.control}
                  name="linkExisting"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="device-link-existing"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                      <FieldContent>
                        <FieldLabel htmlFor="device-link-existing" className="font-normal">
                          Rattacher le device flespi existant s'il porte déjà cet ident
                        </FieldLabel>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    Programmez le boîtier sur l'URI du canal (ex. ch1442013.flespi.gw:39142) avec une SIM data active.
                  </AlertDescription>
                </Alert>
              </>
            ) : null}

            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="device-notes">Notes</FieldLabel>
                  <Textarea {...field} id="device-notes" placeholder="Optionnel" />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={create.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="device-create-form" disabled={create.isPending}>
            {create.isPending ? <Spinner data-icon="inline-start" /> : null}
            Enregistrer le tracker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
