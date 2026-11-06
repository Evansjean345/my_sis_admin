"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { OrganizationSelect } from "@/app/(main)/dashboard/_components/organization/organization-select";
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
import { useCreateSchedule, useUpdateSchedule } from "@/hooks/api/use-schedules";
import { getErrorMessage } from "@/lib/axios";
import { DEFAULT_TIMEZONE, type UsageSchedule } from "@/types/schedule";

import {
  type DraftWindow,
  normalizeWindows,
  validateWindows,
  WEEK_PRESETS,
} from "../../_components/schedules/week-utils";
import { WeekEditor } from "./week-editor";

/** Fuseaux proposés : la sous-région, plus Paris et UTC pour les flottes mixtes. */
const TIMEZONES = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Dakar",
  "Africa/Bamako",
  "Africa/Ouagadougou",
  "Africa/Lome",
  "Africa/Lagos",
  "Africa/Douala",
  "Europe/Paris",
  "UTC",
] as const;

const schema = z.object({
  organizationId: z.string().min(1, { message: "Choisir l'organisation propriétaire." }),
  name: z.string().trim().min(2, { message: "2 caractères minimum." }).max(80),
  description: z.string().trim().max(300),
  timezone: z.string().min(3),
  isActive: z.boolean(),
});

type Values = z.infer<typeof schema>;

function toDefaults(schedule?: UsageSchedule, organizationId?: string): Values {
  return {
    organizationId: schedule?.organizationId ?? organizationId ?? "",
    name: schedule?.name ?? "",
    description: schedule?.description ?? "",
    timezone: schedule?.timezone ?? DEFAULT_TIMEZONE,
    isActive: schedule?.isActive ?? true,
  };
}

/**
 * Création d'un calendrier (informations + semaine type, en une écriture
 * atomique côté API) ou modification de ses informations. Les plages d'un
 * calendrier existant se modifient dans l'onglet « Plages » de son détail.
 */
export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  defaultOrganizationId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent = création. */
  schedule?: UsageSchedule;
  defaultOrganizationId?: string;
  onCreated?: (schedule: UsageSchedule) => void;
}) {
  const create = useCreateSchedule();
  const update = useUpdateSchedule();
  const pending = create.isPending || update.isPending;
  const [windows, setWindows] = useState<DraftWindow[]>(WEEK_PRESETS[0].windows);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toDefaults(schedule) });

  useEffect(() => {
    if (!open) return;
    form.reset(toDefaults(schedule, defaultOrganizationId));
    setWindows(WEEK_PRESETS[0].windows);
  }, [open, schedule, defaultOrganizationId, form]);

  const erreurPlages = schedule ? null : validateWindows(windows);

  function onSubmit(values: Values) {
    if (schedule) {
      update.mutate(
        {
          id: schedule.id,
          payload: {
            name: values.name,
            description: values.description || null,
            timezone: values.timezone,
            isActive: values.isActive,
          },
        },
        {
          onSuccess: () => {
            toast.success("Calendrier modifié", { description: values.name });
            onOpenChange(false);
          },
          onError: (error) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
        },
      );
      return;
    }
    if (erreurPlages) return;
    create.mutate(
      {
        organizationId: values.organizationId,
        name: values.name,
        description: values.description || undefined,
        timezone: values.timezone,
        isActive: values.isActive,
        windows: normalizeWindows(windows),
      },
      {
        onSuccess: (created) => {
          toast.success("Calendrier créé", {
            description: `${created.name} — rattachez-le maintenant à des véhicules ou à des flottes.`,
          });
          onOpenChange(false);
          onCreated?.(created);
        },
        onError: (error) => toast.error("Création impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{schedule ? `Modifier ${schedule.name}` : "Nouveau calendrier"}</DialogTitle>
          <DialogDescription>
            {schedule
              ? "Nom, fuseau et activation. Les plages se modifient dans l'onglet « Plages »."
              : "Un calendrier décrit une semaine type. Il ne coupe aucun moteur tant qu'il n'est rattaché à aucun véhicule ni aucune flotte."}
          </DialogDescription>
        </DialogHeader>

        <form id="schedule-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="schedule-organization">Organisation</FieldLabel>
                  <OrganizationSelect
                    id="schedule-organization"
                    value={field.value || undefined}
                    onChange={(id) => field.onChange(id ?? "")}
                    invalid={fieldState.invalid}
                    disabled={Boolean(schedule)}
                  />
                  {schedule ? <FieldDescription>Un calendrier ne change pas d'organisation.</FieldDescription> : null}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schedule-name">Nom</FieldLabel>
                    <Input
                      {...field}
                      id="schedule-name"
                      placeholder="Heures de service"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="schedule-timezone">Fuseau horaire</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="schedule-timezone" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {(TIMEZONES.includes(field.value as (typeof TIMEZONES)[number])
                            ? TIMEZONES
                            : [field.value, ...TIMEZONES]
                          ).map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="schedule-description">Description</FieldLabel>
                  <Textarea {...field} id="schedule-description" placeholder="Usage, flotte concernée…" rows={2} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <Field orientation="horizontal" className="rounded-lg border p-3">
                  <FieldContent>
                    <FieldLabel htmlFor="schedule-active">Calendrier actif</FieldLabel>
                    <FieldDescription>
                      Inactif, il est ignoré par le moteur : utile pour le préparer avant de l'appliquer.
                    </FieldDescription>
                  </FieldContent>
                  <Switch id="schedule-active" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
            {schedule ? null : (
              <Field className="gap-1.5">
                <FieldLabel>Semaine type</FieldLabel>
                <WeekEditor value={windows} onChange={setWindows} disabled={pending} />
              </Field>
            )}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="schedule-form" disabled={pending || Boolean(erreurPlages)}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {schedule ? "Enregistrer" : "Créer le calendrier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
