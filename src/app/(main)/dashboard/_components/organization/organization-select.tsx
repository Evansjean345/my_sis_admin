"use client";

import { Building2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationsStats } from "@/hooks/api/use-admin";

const ALL = "__all__";

/**
 * Sélecteur d'organisation du tableau de bord admin.
 *
 * Deux usages :
 *  - FILTRE de liste (`allowAll`) : « Toutes les organisations » = pas de filtre ;
 *  - CHAMP de formulaire : l'organisation propriétaire d'une ressource créée
 *    depuis l'admin (les routes `POST /admin/*` l'exigent).
 *
 * Alimenté par `/admin/organizations/stats`, déjà en cache sur l'accueil.
 */
export function OrganizationSelect({
  value,
  onChange,
  id,
  allowAll = false,
  invalid,
  disabled,
  className,
  size = "default",
  placeholder = "Choisir une organisation",
}: {
  value: string | undefined;
  onChange: (organizationId: string | undefined) => void;
  id?: string;
  allowAll?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  placeholder?: string;
}) {
  const organizations = useOrganizationsStats();
  const rows = [...(organizations.data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <Select
      value={value ?? (allowAll ? ALL : "")}
      onValueChange={(v) => onChange(v === ALL ? undefined : v)}
      disabled={(disabled ?? false) || organizations.isPending}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-invalid={invalid}
        className={className ?? "w-full"}
      >
        <Building2 className="text-muted-foreground" />
        <SelectValue
          placeholder={organizations.isPending ? "Chargement…" : placeholder}
        />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectGroup>
          {allowAll ? (
            <SelectItem value={ALL}>Toutes les organisations</SelectItem>
          ) : null}
          {rows.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
              {o.isActive ? null : (
                <span className="text-muted-foreground"> · désactivée</span>
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Nom d'organisation compact pour les cellules de tableau. */
export function OrganizationCell({
  organization,
}: {
  organization?: { name: string; code: string } | null;
}) {
  if (!organization) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{organization.name}</span>
      <span className="truncate text-muted-foreground text-xs">
        {organization.code}
      </span>
    </span>
  );
}

/** Filtre d'organisation des barres d'outils de liste. */
export function OrganizationFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (organizationId: string | undefined) => void;
}) {
  return (
    <OrganizationSelect
      allowAll
      size="sm"
      value={value}
      onChange={onChange}
      className="w-auto min-w-52"
      placeholder="Toutes les organisations"
    />
  );
}
