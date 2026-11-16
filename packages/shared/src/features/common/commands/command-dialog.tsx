"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
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
import { Input } from "@shared/components/ui/input";
import { Spinner } from "@shared/components/ui/spinner";
import { Textarea } from "@shared/components/ui/textarea";

export interface CommandFormValues {
  reason: string;
  data?: string;
}

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Affiche un champ « data » obligatoire. */
  requiresData?: boolean;
  dataLabel?: string;
  dataPlaceholder?: string;
  dataHint?: string;
  /** Message d'avertissement (commande agissant sur du matériel sensible). */
  warning?: string;
  confirmLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onSubmit: (values: CommandFormValues) => void;
}

/**
 * Saisie du MOTIF (obligatoire, pièce d'audit) et, si besoin, du paramètre
 * d'une commande boîtier. L'envoi et la synchronisation sont faits par le parent.
 */
export function CommandDialog({
  open,
  onOpenChange,
  title,
  description,
  requiresData = false,
  dataLabel = "Paramètre",
  dataPlaceholder,
  dataHint,
  warning,
  confirmLabel = "Envoyer la commande",
  destructive = false,
  pending = false,
  onSubmit,
}: CommandDialogProps) {
  const schema = z.object({
    reason: z
      .string()
      .trim()
      .min(5, { message: "Le motif doit contenir au moins 5 caractères." })
      .max(300, { message: "300 caractères maximum." }),
    data: requiresData
      ? z.string().trim().min(1, { message: "Ce paramètre est obligatoire." }).max(200)
      : z.string().trim().max(200),
  });

  const form = useForm<{ reason: string; data: string }>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", data: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "", data: "" });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <form
          id="command-form"
          noValidate
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((values) =>
            onSubmit({ reason: values.reason.trim(), data: values.data?.trim() || undefined }),
          )}
        >
          {warning ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
              <ShieldAlert className="size-4" />
              <AlertTitle>Action sur matériel réel</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup className="gap-4">
            {requiresData ? (
              <Controller
                control={form.control}
                name="data"
                render={({ field, fieldState }) => (
                  <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="command-data">{dataLabel}</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id="command-data"
                      placeholder={dataPlaceholder}
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    {dataHint ? <FieldDescription>{dataHint}</FieldDescription> : null}
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ) : null}
            <Controller
              control={form.control}
              name="reason"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="command-reason">Motif</FieldLabel>
                  <Textarea
                    {...field}
                    id="command-reason"
                    placeholder="Ex. Vérification de la remontée après installation"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Obligatoire : le motif est conservé dans la piste d'audit.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            form="command-form"
            type="submit"
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Envoi et synchronisation…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
