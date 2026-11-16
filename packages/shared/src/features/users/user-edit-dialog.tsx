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
import { FieldGroup } from "@shared/components/ui/field";
import { Spinner } from "@shared/components/ui/spinner";
import { RoleSelectField, StatusSelectField, TextField } from "@shared/features/users/user-form-fields";
import { useAssignableRoles } from "@shared/hooks/api/use-organizations";
import { useUpdateUser } from "@shared/hooks/api/use-users";
import { getErrorMessage } from "@shared/lib/axios";
import type { UpdateUserPayload, User } from "@shared/types/user";

const PHONE = /^\+[1-9]\d{7,14}$/;

const schema = z.object({
  fullName: z.string().trim().min(3, { message: "3 caractères minimum." }).max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || PHONE.test(v), { message: "Format international attendu : +2250700000000" }),
  roleId: z.string().min(1),
  status: z.enum(["pending", "active", "suspended"]),
});

type Values = z.infer<typeof schema>;

export function UserEditDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Rôles de l'organisation DU COMPTE (système + propres) : un rôle d'un autre client serait refusé.
  const roles = useAssignableRoles(user.organizationId, open);
  const update = useUpdateUser();
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      form.reset({ fullName: user.fullName, phone: user.phone ?? "", roleId: user.roleId, status: user.status });
    }
  }, [open, user, form]);

  function onSubmit(values: Values) {
    // N'envoie que ce qui a changé : l'API refuse un téléphone vide.
    const payload: UpdateUserPayload = {};
    if (values.fullName !== user.fullName) payload.fullName = values.fullName;
    if (values.phone && values.phone !== (user.phone ?? "")) payload.phone = values.phone;
    if (values.roleId !== user.roleId) payload.roleId = values.roleId;
    if (values.status !== user.status) payload.status = values.status;

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }

    update.mutate(
      { id: user.id, payload },
      {
        onSuccess: () => {
          toast.success("Utilisateur mis à jour", { description: values.fullName });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Mise à jour impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form id={`user-edit-${user.id}`} noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <TextField control={form.control} name="fullName" label="Nom complet" autoComplete="off" />
            <TextField control={form.control} name="phone" label="Téléphone" placeholder="+2250700000000" />
            <div className="grid gap-4 sm:grid-cols-2">
              <RoleSelectField control={form.control} name="roleId" roles={roles.data ?? []} />
              <StatusSelectField control={form.control} name="status" />
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={update.isPending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" form={`user-edit-${user.id}`} disabled={update.isPending}>
            {update.isPending ? <Spinner data-icon="inline-start" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
