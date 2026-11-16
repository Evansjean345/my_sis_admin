"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Spinner } from "@shared/components/ui/spinner";
import { OrganizationSelect } from "@shared/features/common/organization/organization-select";
import { RoleSelectField, StatusSelectField, TextField } from "@shared/features/users/user-form-fields";
import { useAssignableRoles } from "@shared/hooks/api/use-organizations";
import { useCreateUser } from "@shared/hooks/api/use-users";
import { getErrorMessage } from "@shared/lib/axios";

const PHONE = /^\+[1-9]\d{7,14}$/;

const schema = z.object({
  /** Organisation du compte — exigée par POST /admin/users. */
  organizationId: z.string().min(1, { message: "Choisir l'organisation du compte." }),
  fullName: z.string().trim().min(3, { message: "3 caractères minimum." }).max(120),
  email: z.email({ message: "Adresse e-mail invalide." }),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || PHONE.test(v), { message: "Format international attendu : +2250700000000" }),
  password: z.string().min(12, { message: "12 caractères minimum." }).max(128),
  roleId: z.string().min(1, { message: "Choisissez un rôle." }),
  status: z.enum(["pending", "active", "suspended"]),
});

type Values = z.infer<typeof schema>;

const DEFAULTS: Values = {
  organizationId: "",
  fullName: "",
  email: "",
  phone: "",
  password: "",
  roleId: "",
  status: "active",
};

export function UserCreateDialog({
  open,
  onOpenChange,
  defaultOrganizationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Organisation présélectionnée (ex. filtre de la liste). */
  defaultOrganizationId?: string;
}) {
  const create = useCreateUser();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });
  const organizationId = useWatch({ control: form.control, name: "organizationId" });
  // Rôles utilisables DANS l'organisation cible (système + propres), avec le
  // drapeau `assignable` calculé par la même règle que l'écriture.
  const roles = useAssignableRoles(organizationId || undefined);

  useEffect(() => {
    if (open) form.reset({ ...DEFAULTS, organizationId: defaultOrganizationId ?? "" });
  }, [open, defaultOrganizationId, form]);

  function onSubmit(values: Values) {
    create.mutate(
      { ...values, phone: values.phone || undefined },
      {
        onSuccess: (user) => {
          toast.success("Utilisateur créé", { description: user.email });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Création impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>Le compte est rattaché à l'organisation choisie ; son rôle en dépend.</DialogDescription>
        </DialogHeader>
        <form id="user-create-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-organization">Organisation</FieldLabel>
                  <OrganizationSelect
                    id="user-organization"
                    value={field.value || undefined}
                    onChange={(id) => {
                      field.onChange(id ?? "");
                      // Un rôle propre à l'ancienne organisation serait refusé (422).
                      form.setValue("roleId", "");
                    }}
                    invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <TextField control={form.control} name="fullName" label="Nom complet" autoComplete="off" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField control={form.control} name="email" label="E-mail" type="email" autoComplete="off" />
              <TextField control={form.control} name="phone" label="Téléphone" placeholder="+2250700000000" />
            </div>
            <TextField
              control={form.control}
              name="password"
              label="Mot de passe initial"
              type="password"
              autoComplete="new-password"
              description="12 caractères minimum."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <RoleSelectField control={form.control} name="roleId" roles={roles.data ?? []} />
                {organizationId ? null : <FieldDescription>Choisissez d'abord l'organisation.</FieldDescription>}
              </div>
              <StatusSelectField control={form.control} name="status" />
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={create.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="user-create-form" disabled={create.isPending}>
            {create.isPending ? <Spinner data-icon="inline-start" /> : null}
            Créer l'utilisateur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
