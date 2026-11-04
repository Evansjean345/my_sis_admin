"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useCreateOrganization, useUpdateOrganization } from "@/hooks/api/use-organizations";
import { getErrorMessage } from "@/lib/axios";
import type { CreateOrganizationPayload, Organization, UpdateOrganizationPayload } from "@/types/organization";

import { OrganizationTextField } from "./organization-form-fields";

const CODE = /^[a-z0-9_-]{2,40}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;

const optionalPhone = z
  .string()
  .trim()
  .refine((value) => value === "" || PHONE.test(value), { message: "Format international attendu : +2250700000000." });

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, { message: "Adresse e-mail invalide." });

/** Mêmes contraintes que `organization_validators.ts` — et que les CHECK de la table. */
const schema = z
  .object({
    code: z
      .string()
      .trim()
      .toLowerCase()
      .refine((value) => CODE.test(value), { message: "2 à 40 caractères : minuscules, chiffres, tiret ou souligné." }),
    name: z.string().trim().min(2, { message: "2 caractères minimum." }).max(150),
    contactEmail: optionalEmail,
    contactPhone: optionalPhone,
    countryCode: z
      .string()
      .trim()
      .refine((value) => value === "" || /^[A-Za-z]{2}$/.test(value), { message: "Code pays ISO à deux lettres." }),
    timezone: z.string().trim().max(60),
    maxVehicles: z
      .string()
      .trim()
      .refine((value) => value === "" || (Number.isInteger(Number(value)) && Number(value) > 0), {
        message: "Nombre entier positif attendu.",
      }),
    withAdmin: z.boolean(),
    adminFullName: z.string().trim(),
    adminEmail: z.string().trim(),
    adminPassword: z.string(),
    adminPhone: optionalPhone,
  })
  .superRefine((values, ctx) => {
    if (!values.withAdmin) return;
    if (values.adminFullName.length < 3) {
      ctx.addIssue({ code: "custom", path: ["adminFullName"], message: "3 caractères minimum." });
    }
    if (!z.email().safeParse(values.adminEmail).success) {
      ctx.addIssue({ code: "custom", path: ["adminEmail"], message: "Adresse e-mail invalide." });
    }
    if (values.adminPassword.length < 12) {
      ctx.addIssue({ code: "custom", path: ["adminPassword"], message: "12 caractères minimum." });
    }
  });

type Values = z.infer<typeof schema>;

const DEFAULTS: Values = {
  code: "",
  name: "",
  contactEmail: "",
  contactPhone: "",
  countryCode: "CI",
  timezone: "Africa/Abidjan",
  maxVehicles: "",
  withAdmin: true,
  adminFullName: "",
  adminEmail: "",
  adminPassword: "",
  adminPhone: "",
};

/**
 * `settings` est remplacé en entier par l'API : on repart donc des réglages
 * existants. Vider le champ RETIRE le plafond au lieu de le conserver — sans
 * quoi une limite ne pourrait jamais être levée depuis l'écran.
 */
function toSettings(maxVehicles: string, previous: Record<string, unknown> = {}) {
  const { maxVehicles: _previousMax, ...rest } = previous;
  if (maxVehicles === "") return Object.keys(rest).length > 0 ? rest : {};
  return { ...rest, maxVehicles: Number(maxVehicles) };
}

/**
 * Création et modification d'une organisation.
 *
 * À la création, le bloc administrateur est optionnel mais recommandé :
 * l'API le crée dans la MÊME transaction, et une organisation sans compte
 * n'est joignable par personne. En modification, le `code` disparaît du
 * formulaire — il sert d'identifiant stable aux intégrations tierces.
 */
export function OrganizationFormDialog({
  organization,
  open,
  onOpenChange,
}: {
  organization?: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateOrganization();
  const update = useUpdateOrganization();
  const pending = create.isPending || update.isPending;
  const isEdit = Boolean(organization);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const withAdmin = form.watch("withAdmin");

  useEffect(() => {
    if (!open) return;
    if (organization) {
      const max = organization.settings.maxVehicles;
      form.reset({
        ...DEFAULTS,
        code: organization.code,
        name: organization.name,
        contactEmail: organization.contactEmail ?? "",
        contactPhone: organization.contactPhone ?? "",
        countryCode: organization.countryCode ?? "",
        timezone: organization.timezone,
        maxVehicles: typeof max === "number" ? String(max) : "",
        withAdmin: false,
      });
      return;
    }
    form.reset(DEFAULTS);
  }, [open, organization, form]);

  function onSubmit(values: Values) {
    if (organization) {
      const payload: UpdateOrganizationPayload = {
        name: values.name,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        countryCode: values.countryCode ? values.countryCode.toUpperCase() : undefined,
        timezone: values.timezone || undefined,
        settings: toSettings(values.maxVehicles, organization.settings),
      };
      update.mutate(
        { id: organization.id, payload },
        {
          onSuccess: (updated) => {
            toast.success("Organisation modifiée", { description: updated.name });
            onOpenChange(false);
          },
          onError: (error) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
        },
      );
      return;
    }

    const payload: CreateOrganizationPayload = {
      code: values.code,
      name: values.name,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      countryCode: values.countryCode ? values.countryCode.toUpperCase() : undefined,
      timezone: values.timezone || undefined,
      settings: toSettings(values.maxVehicles),
      admin: values.withAdmin
        ? {
            email: values.adminEmail,
            password: values.adminPassword,
            fullName: values.adminFullName,
            phone: values.adminPhone || undefined,
          }
        : undefined,
    };

    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success("Organisation créée", {
          description: created.admin
            ? `${created.organization.name} · administrateur ${created.admin.email}`
            : created.organization.name,
        });
        onOpenChange(false);
      },
      onError: (error) => toast.error("Création impossible", { description: getErrorMessage(error) }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Modifier ${organization?.name}` : "Nouvelle organisation"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Le code d'organisation n'est pas modifiable : il sert d'identifiant stable aux intégrations."
              : "L'organisation et son premier administrateur sont créés dans une seule transaction."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <form
            id="organization-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 px-1"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {isEdit ? null : (
                <OrganizationTextField
                  control={form.control}
                  name="code"
                  label="Code"
                  placeholder="transports-kone"
                  description="Minuscules, chiffres, tiret ou souligné. Définitif."
                  className="font-mono"
                />
              )}
              <OrganizationTextField
                control={form.control}
                name="name"
                label="Raison sociale"
                placeholder="Transports Koné"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OrganizationTextField
                control={form.control}
                name="contactEmail"
                label="E-mail de contact"
                type="email"
                placeholder="contact@kone.ci"
              />
              <OrganizationTextField
                control={form.control}
                name="contactPhone"
                label="Téléphone de contact"
                placeholder="+2250700000001"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <OrganizationTextField control={form.control} name="countryCode" label="Pays" placeholder="CI" />
              <OrganizationTextField
                control={form.control}
                name="timezone"
                label="Fuseau horaire"
                placeholder="Africa/Abidjan"
              />
            </div>

            <OrganizationTextField
              control={form.control}
              name="maxVehicles"
              label="Plafond de véhicules"
              placeholder="50"
              description="Laissez vide pour ne pas fixer de plafond."
            />

            {isEdit ? null : (
              <>
                <Separator />
                <Field orientation="horizontal" className="items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <FieldLabel htmlFor="field-with-admin">Créer le premier administrateur</FieldLabel>
                    <FieldDescription>
                      Sans ce compte, personne ne pourra se connecter à la nouvelle organisation.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="field-with-admin"
                    checked={withAdmin}
                    onCheckedChange={(checked) => form.setValue("withAdmin", checked === true)}
                  />
                </Field>

                {withAdmin ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <OrganizationTextField
                        control={form.control}
                        name="adminFullName"
                        label="Nom complet"
                        placeholder="Directeur Koné"
                      />
                      <OrganizationTextField
                        control={form.control}
                        name="adminEmail"
                        label="E-mail"
                        type="email"
                        placeholder="direction@kone.ci"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <OrganizationTextField
                        control={form.control}
                        name="adminPassword"
                        label="Mot de passe initial"
                        type="password"
                        autoComplete="new-password"
                        description="12 caractères minimum."
                      />
                      <OrganizationTextField
                        control={form.control}
                        name="adminPhone"
                        label="Téléphone"
                        placeholder="+2250700000002"
                      />
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="organization-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {isEdit ? "Enregistrer" : "Créer l'organisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
