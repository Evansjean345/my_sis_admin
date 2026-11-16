"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Spinner } from "@shared/components/ui/spinner";
import { OrganizationTextField } from "@shared/features/entreprises/organization-form-fields";
import { useCreateOrganizationUser, useOrganizationRoles } from "@shared/hooks/api/use-organizations";
import { getErrorMessage } from "@shared/lib/axios";

const PHONE = /^\+[1-9]\d{7,14}$/;

const schema = z.object({
  fullName: z.string().trim().min(3, { message: "3 caractères minimum." }).max(120),
  email: z.email({ message: "Adresse e-mail invalide." }),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || PHONE.test(value), { message: "Format international : +2250700000000." }),
  password: z.string().min(12, { message: "12 caractères minimum." }).max(128),
  roleId: z.string().min(1, { message: "Choisissez un rôle." }),
});

type Values = z.infer<typeof schema>;

const DEFAULTS: Values = { fullName: "", email: "", phone: "", password: "", roleId: "" };

/**
 * Rattache un compte à l'organisation désignée.
 *
 * Seuls les rôles marqués `assignable` sont proposés : l'API refuserait les
 * autres au nom de la non-escalade, autant ne pas les offrir.
 */
export function OrganizationUserDialog({
  organizationId,
  organizationName,
  open,
  onOpenChange,
}: {
  organizationId: string;
  organizationName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roles = useOrganizationRoles(open ? organizationId : undefined);
  const create = useCreateOrganizationUser(organizationId);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  const assignable = (roles.data ?? []).filter((role) => role.assignable);

  function onSubmit(values: Values) {
    create.mutate(
      { ...values, phone: values.phone || undefined },
      {
        onSuccess: (user) => {
          toast.success("Compte créé", { description: `${user.email} · ${user.role.code}` });
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
          <DialogTitle>Nouveau compte</DialogTitle>
          <DialogDescription>Le compte sera rattaché à {organizationName}.</DialogDescription>
        </DialogHeader>

        <form id="organization-user-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <OrganizationTextField control={form.control} name="fullName" label="Nom complet" />
            <div className="grid gap-4 sm:grid-cols-2">
              <OrganizationTextField control={form.control} name="email" label="E-mail" type="email" />
              <OrganizationTextField
                control={form.control}
                name="phone"
                label="Téléphone"
                placeholder="+2250700000000"
              />
            </div>
            <OrganizationTextField
              control={form.control}
              name="password"
              label="Mot de passe initial"
              type="password"
              autoComplete="new-password"
              description="12 caractères minimum."
            />

            <Field className="gap-1.5" data-invalid={Boolean(form.formState.errors.roleId)}>
              <FieldLabel htmlFor="field-organization-role">Rôle</FieldLabel>
              <Select
                value={form.watch("roleId")}
                onValueChange={(value) => form.setValue("roleId", value, { shouldValidate: true })}
              >
                <SelectTrigger id="field-organization-role" className="w-full">
                  <SelectValue placeholder={roles.isPending ? "Chargement…" : "Choisir un rôle"} />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectGroup>
                    {assignable.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Seuls les rôles que vous pouvez attribuer sont proposés.</FieldDescription>
              {form.formState.errors.roleId ? <FieldError errors={[form.formState.errors.roleId]} /> : null}
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={create.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="organization-user-form" disabled={create.isPending}>
            {create.isPending ? <Spinner data-icon="inline-start" /> : null}
            Créer le compte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
