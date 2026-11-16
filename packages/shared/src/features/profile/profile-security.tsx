"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { Spinner } from "@shared/components/ui/spinner";
import { useChangePassword } from "@shared/hooks/api/use-auth";
import { getErrorMessage } from "@shared/lib/axios";

const schema = z
  .object({
    currentPassword: z.string().min(8, { message: "Mot de passe actuel requis." }),
    newPassword: z
      .string()
      .min(12, { message: "12 caractères minimum." })
      .max(128, { message: "128 caractères maximum." }),
    newPassword_confirmation: z.string(),
  })
  .refine((v) => v.newPassword === v.newPassword_confirmation, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["newPassword_confirmation"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["newPassword"],
  });

type Values = z.infer<typeof schema>;

const FIELDS: Array<{ name: keyof Values; label: string; autoComplete: string; hint?: string }> = [
  { name: "currentPassword", label: "Mot de passe actuel", autoComplete: "current-password" },
  {
    name: "newPassword",
    label: "Nouveau mot de passe",
    autoComplete: "new-password",
    hint: "12 caractères minimum : ce compte peut demander l'immobilisation d'un véhicule.",
  },
  { name: "newPassword_confirmation", label: "Confirmation", autoComplete: "new-password" },
];

export function ProfileSecurity() {
  const change = useChangePassword();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", newPassword_confirmation: "" },
  });

  function onSubmit(values: Values) {
    change.mutate(values, {
      onSuccess: () => {
        form.reset();
        toast.success("Mot de passe modifié", {
          description: "Vos autres sessions ont été fermées. Cette session reste active.",
        });
      },
      onError: (error) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
    });
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Changer le mot de passe
        </CardTitle>
        <CardDescription>Le mot de passe actuel est exigé. Tous vos autres jetons seront révoqués.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="password-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            {FIELDS.map((f) => (
              <Controller
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`pwd-${f.name}`}>{f.label}</FieldLabel>
                    <Input
                      {...field}
                      id={`pwd-${f.name}`}
                      type="password"
                      autoComplete={f.autoComplete}
                      aria-invalid={fieldState.invalid}
                    />
                    {f.hint ? <FieldDescription>{f.hint}</FieldDescription> : null}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-2 border-t py-3">
        {/* Mot de passe actuel oublié : même parcours que la page de connexion, code par SMS. */}
        <Button type="button" variant="link" className="h-auto p-0 text-muted-foreground" asChild>
          <Link href="/auth/v2/forgot-password" prefetch={false}>
            Mot de passe actuel oublié ? Recevoir un code par SMS
          </Link>
        </Button>
        <Button type="submit" form="password-form" disabled={change.isPending}>
          {change.isPending ? <Spinner data-icon="inline-start" /> : null}
          Mettre à jour
        </Button>
      </CardFooter>
    </Card>
  );
}
