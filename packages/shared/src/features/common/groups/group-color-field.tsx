"use client";

import { cn } from "cn";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { GROUP_COLORS } from "@shared/types/group";

/**
 * Couleur du groupe.
 *
 * L'API n'accepte que `#RRGGBB` : la palette évite la faute de frappe, la
 * saisie libre reste possible pour coller à une charte existante.
 */
export function GroupColorField<T extends FieldValues>({ control, name }: { control: Control<T>; name: FieldPath<T> }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value as string | undefined) ?? "";
        return (
          <Field className="gap-1.5" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`field-${name}`}>Couleur</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {GROUP_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Choisir la couleur ${color}`}
                  aria-pressed={value.toLowerCase() === color.toLowerCase()}
                  onClick={() => field.onChange(color)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    value.toLowerCase() === color.toLowerCase()
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
              <Input
                {...field}
                value={value}
                id={`field-${name}`}
                className="h-8 w-32 font-mono uppercase"
                placeholder="#1D4ED8"
                aria-invalid={fieldState.invalid}
              />
            </div>
            <FieldDescription>Format hexadécimal à six chiffres, par exemple #1D4ED8.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

/** Pastille de couleur d'un groupe, avec repli neutre quand aucune n'est définie. */
export function GroupColorDot({ color, className }: { color: string | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", !color && "bg-muted-foreground", className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
