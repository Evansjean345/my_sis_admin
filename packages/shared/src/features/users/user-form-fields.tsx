"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";

import { userStatusMeta } from "@shared/components/status-labels";
import { Field, FieldDescription, FieldError, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import type { Role } from "@shared/types/role";
import type { UserStatus } from "@shared/types/user";

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  description?: string;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  description,
}: TextFieldProps<T>) {
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

export function RoleSelectField<T extends FieldValues>({
  control,
  name,
  roles,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  /** `assignable: false` (règle de non-escalade de l'API) grise le rôle. */
  roles: Array<Pick<Role, "id" | "name"> & { assignable?: boolean }>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`field-${name}`}>Rôle</FieldLabel>
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id={`field-${name}`} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue placeholder="Choisir un rôle" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id} disabled={role.assignable === false}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function StatusSelectField<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: FieldPath<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`field-${name}`}>Statut</FieldLabel>
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <SelectTrigger id={`field-${name}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {(Object.keys(userStatusMeta) as UserStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {userStatusMeta[status].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
