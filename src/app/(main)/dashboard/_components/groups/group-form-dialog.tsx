"use client";

import { useEffect } from "react";

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateGroup, useUpdateGroup } from "@/hooks/api/use-groups";
import { getErrorMessage } from "@/lib/axios";
import type { Group } from "@/types/group";

import { GroupColorField } from "./group-color-field";
import type { GroupFamily } from "./group-family";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Mêmes bornes que `group_validators.ts` : une saisie refusée ici l'aurait été là. */
const schema = z.object({
  /** Organisation du groupe : exigée à la création (POST /admin/…-groups), figée ensuite. */
  organizationId: z.string().min(1, { message: "Choisir l'organisation du groupe." }),
  name: z.string().trim().min(2, { message: "2 caractères minimum." }).max(80, { message: "80 caractères maximum." }),
  description: z.string().trim().max(300, { message: "300 caractères maximum." }),
  color: z
    .string()
    .trim()
    .refine((value) => value === "" || HEX.test(value), { message: "Format attendu : #RRGGBB." }),
});

type Values = z.infer<typeof schema>;

const DEFAULTS: Values = { organizationId: "", name: "", description: "", color: "" };

/**
 * Création et modification d'un groupe.
 *
 * Un seul dialogue pour les deux gestes : les champs sont identiques, et
 * deux composants jumeaux divergeraient au premier ajustement.
 */
export function GroupFormDialog({
  family,
  group,
  open,
  onOpenChange,
  onCreated,
  defaultOrganizationId,
}: {
  family: GroupFamily;
  /** `undefined` → création. */
  group?: Group;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (group: Group) => void;
  /** Organisation présélectionnée à la création (ex. filtre de la liste). */
  defaultOrganizationId?: string;
}) {
  const create = useCreateGroup(family.kind);
  const update = useUpdateGroup(family.kind);
  const pending = create.isPending || update.isPending;
  const isEdit = Boolean(group);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  useEffect(() => {
    if (!open) return;
    form.reset(
      group
        ? {
            organizationId: group.organizationId,
            name: group.name,
            description: group.description ?? "",
            color: group.color ?? "",
          }
        : { ...DEFAULTS, organizationId: defaultOrganizationId ?? "", color: "" },
    );
  }, [open, group, defaultOrganizationId, form]);

  function onSubmit(values: Values) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      color: values.color || undefined,
    };

    if (group) {
      update.mutate(
        { id: group.id, payload },
        {
          onSuccess: (updated) => {
            toast.success("Groupe modifié", { description: updated.name });
            onOpenChange(false);
          },
          onError: (error) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
        },
      );
      return;
    }

    create.mutate(
      { ...payload, organizationId: values.organizationId },
      {
        onSuccess: (created) => {
          toast.success("Groupe créé", { description: created.name });
          onOpenChange(false);
          onCreated?.(created);
        },
        onError: (error) => toast.error("Création impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Modifier ${group?.name}` : `Nouvelle ${family.singular}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Le nom doit rester unique dans l'organisation du groupe."
              : `Le groupe est créé vide : vous y ajouterez vos ${family.memberPlural} ensuite.`}
          </DialogDescription>
        </DialogHeader>

        <form id="group-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="organizationId"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="field-group-organization">Organisation</FieldLabel>
                  <OrganizationSelect
                    id="field-group-organization"
                    value={field.value || undefined}
                    onChange={(id) => field.onChange(id ?? "")}
                    invalid={fieldState.invalid}
                    disabled={isEdit}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Field className="gap-1.5" data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="field-group-name">Nom</FieldLabel>
              <Input
                {...form.register("name")}
                id="field-group-name"
                autoComplete="off"
                placeholder={family.namePlaceholder}
                aria-invalid={Boolean(form.formState.errors.name)}
              />
              {form.formState.errors.name ? <FieldError errors={[form.formState.errors.name]} /> : null}
            </Field>

            <Field className="gap-1.5" data-invalid={Boolean(form.formState.errors.description)}>
              <FieldLabel htmlFor="field-group-description">Description</FieldLabel>
              <Textarea
                {...form.register("description")}
                id="field-group-description"
                rows={3}
                placeholder="À quoi sert ce groupe ?"
                aria-invalid={Boolean(form.formState.errors.description)}
              />
              {form.formState.errors.description ? <FieldError errors={[form.formState.errors.description]} /> : null}
            </Field>

            <GroupColorField control={form.control} name="color" />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form="group-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {isEdit ? "Enregistrer" : "Créer le groupe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
