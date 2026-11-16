"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";

interface OrganizationTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: string;
  placeholder?: string;
  description?: string;
  autoComplete?: string;
  className?: string;
}

/**
 * Champ texte des formulaires d'organisation.
 *
 * Même structure que les champs de l'écran Utilisateurs (Field + Input +
 * FieldError) : les formulaires du tableau de bord se ressemblent, et c'est
 * volontaire.
 */
export function OrganizationTextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  description,
  autoComplete = "off",
  className,
}: OrganizationTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
          <Input
            {...field}
            value={field.value ?? ""}
            id={`field-${name}`}
            type={type}
            className={className}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
