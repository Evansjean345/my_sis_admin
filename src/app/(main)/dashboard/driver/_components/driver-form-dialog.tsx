"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCreateDriver, useUpdateDriver } from "@/hooks/api/use-drivers";
import { getErrorMessage } from "@/lib/axios";
import {
  type CreateDriverPayload,
  DRIVER_STATUSES,
  type Driver,
  type DriverStatus,
  driverStatusMeta,
  LICENSE_CATEGORIES,
  type LicenseCategory,
  type UpdateDriverPayload,
} from "@/types/driver";

import { DriverOrganizationSelect, DriverVehicleSelect } from "./driver-selects";

const E164 = /^\+[1-9][0-9]{7,14}$/;

const schema = z.object({
  organizationId: z.string().nullable(),
  firstName: z.string().trim().min(1, { message: "Prénom obligatoire." }).max(60),
  lastName: z.string().trim().min(1, { message: "Nom obligatoire." }).max(60),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || E164.test(v), { message: "Format international : +2250700000000." }),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, { message: "Adresse e-mail invalide." }),
  employeeCode: z.string().trim().max(40),
  licenseNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || v.length >= 3, { message: "3 caractères minimum." }),
  licenseCategories: z.array(z.enum(LICENSE_CATEGORIES)),
  licenseExpiresOn: z.string(),
  status: z.enum(DRIVER_STATUSES),
  vehicleId: z.string().nullable(),
  notes: z.string().trim().max(500),
});

type Values = z.infer<typeof schema>;

function toDefaults(driver?: Driver, organizationId?: string | null): Values {
  return {
    organizationId: driver ? driver.organizationId : (organizationId ?? null),
    firstName: driver?.firstName ?? "",
    lastName: driver?.lastName ?? "",
    phone: driver?.phone ?? "",
    email: driver?.email ?? "",
    employeeCode: driver?.employeeCode ?? "",
    licenseNumber: driver?.licenseNumber ?? "",
    licenseCategories: driver?.licenseCategories ?? [],
    licenseExpiresOn: driver?.licenseExpiresOn?.slice(0, 10) ?? "",
    status: driver?.status ?? "active",
    vehicleId: driver?.vehicleId ?? null,
    notes: driver?.notes ?? "",
  };
}

/**
 * Création d'un conducteur — l'ORGANISATION SE CHOISIT (ou pas : vivier) —
 * ou modification de sa fiche. Un changement d'organisation a des effets
 * (véhicule retiré, équipes quittées) : il se fait depuis la fiche, carte
 * « Organisation », pour que ces effets soient annoncés.
 */
export function DriverFormDialog({
  open,
  onOpenChange,
  driver,
  defaultOrganizationId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver;
  defaultOrganizationId?: string | null;
  onCreated?: (driver: Driver) => void;
}) {
  const create = useCreateDriver();
  const update = useUpdateDriver();
  const pending = create.isPending || update.isPending;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toDefaults(driver) });
  const organizationId = form.watch("organizationId");

  useEffect(() => {
    if (open) form.reset(toDefaults(driver, defaultOrganizationId));
  }, [open, driver, defaultOrganizationId, form]);

  function onSubmit(values: Values) {
    const nom = `${values.firstName} ${values.lastName}`;
    if (driver) {
      const payload: UpdateDriverPayload = {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || null,
        email: values.email || null,
        employeeCode: values.employeeCode || null,
        licenseNumber: values.licenseNumber || null,
        licenseCategories: values.licenseCategories,
        licenseExpiresOn: values.licenseExpiresOn || null,
        status: values.status,
        vehicleId: values.vehicleId,
        notes: values.notes || null,
      };
      update.mutate(
        { id: driver.id, payload },
        {
          onSuccess: () => {
            toast.success("Conducteur modifié", { description: nom });
            onOpenChange(false);
          },
          onError: (error) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
        },
      );
      return;
    }

    const opt = (v: string) => (v === "" ? undefined : v);
    const payload: CreateDriverPayload = {
      organizationId: values.organizationId,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: opt(values.phone),
      email: opt(values.email),
      employeeCode: opt(values.employeeCode),
      licenseNumber: opt(values.licenseNumber),
      licenseCategories: values.licenseCategories,
      licenseExpiresOn: opt(values.licenseExpiresOn),
      status: values.status,
      vehicleId: values.vehicleId ?? undefined,
      notes: opt(values.notes),
    };
    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success("Conducteur créé", {
          description: values.organizationId ? nom : `${nom} — dans le vivier (sans organisation).`,
        });
        onOpenChange(false);
        onCreated?.(created);
      },
      onError: (error) => toast.error("Création impossible", { description: getErrorMessage(error) }),
    });
  }

  const text = (
    name: "firstName" | "lastName" | "phone" | "email" | "employeeCode" | "licenseNumber",
    label: string,
    placeholder: string,
  ) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`driver-${name}`}>{label}</FieldLabel>
          <Input {...field} id={`driver-${name}`} placeholder={placeholder} aria-invalid={fieldState.invalid} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{driver ? `Modifier ${driver.fullName}` : "Nouveau conducteur"}</DialogTitle>
          <DialogDescription>
            Un conducteur rattaché à une organisation ne conduit que ses véhicules. Sans organisation, il rejoint le
            vivier de l'exploitant.
          </DialogDescription>
        </DialogHeader>

        <form id="driver-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="driver-organization">Organisation</FieldLabel>
                  <DriverOrganizationSelect
                    id="driver-organization"
                    value={field.value}
                    disabled={Boolean(driver)}
                    onChange={(id) => {
                      field.onChange(id);
                      // Le véhicule choisi appartenait peut-être à l'organisation précédente.
                      form.setValue("vehicleId", null);
                    }}
                  />
                  <FieldDescription>
                    {driver
                      ? "Pour changer d'organisation, utilisez la carte « Organisation » de la fiche : ses effets y sont annoncés."
                      : "Facultative. Vous pourrez rattacher ou déplacer le conducteur plus tard."}
                  </FieldDescription>
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {text("firstName", "Prénom", "Koffi")}
              {text("lastName", "Nom", "Yao")}
              {text("phone", "Téléphone", "+2250700000000")}
              {text("email", "E-mail", "k.yao@exemple.ci")}
              {text("employeeCode", "Matricule", "TR-001")}
              {text("licenseNumber", "N° de permis", "CI-123456")}
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <Controller
                control={form.control}
                name="licenseCategories"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel>Catégories de permis</FieldLabel>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      size="sm"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as LicenseCategory[])}
                      className="flex-wrap"
                    >
                      {LICENSE_CATEGORIES.map((c) => (
                        <ToggleGroupItem key={c} value={c} aria-label={`Catégorie ${c}`} className="min-w-9">
                          {c}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="licenseExpiresOn"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="driver-license-expiry">Permis valable jusqu'au</FieldLabel>
                    <Input {...field} id="driver-license-expiry" type="date" />
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="driver-vehicle">Véhicule</FieldLabel>
                    <DriverVehicleSelect
                      id="driver-vehicle"
                      organizationId={organizationId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="driver-status">Statut</FieldLabel>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as DriverStatus)}>
                      <SelectTrigger id="driver-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectGroup>
                          {DRIVER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {driverStatusMeta[s].label}
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
              name="notes"
              render={({ field }) => (
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="driver-notes">Notes</FieldLabel>
                  <Textarea {...field} id="driver-notes" rows={2} placeholder="Informations complémentaires" />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="driver-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {driver ? "Enregistrer" : "Créer le conducteur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
