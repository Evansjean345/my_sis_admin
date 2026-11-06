"use client";

import { Building2, Truck } from "lucide-react";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationsStats } from "@/hooks/api/use-admin";
import { useVehicles } from "@/hooks/api/use-vehicles";

/** Valeurs spéciales des sélecteurs (une valeur vide n'est pas admise par Radix Select). */
export const ALL_ORGANIZATIONS = "__all__";
export const NO_ORGANIZATION = "__none__";
const NO_VEHICLE = "__none__";

/**
 * Organisation d'un conducteur — FACULTATIVE.
 *
 * `null` = aucune organisation : le conducteur rejoint le vivier de
 * l'exploitant, invisible des comptes clients.
 */
export function DriverOrganizationSelect({
  value,
  onChange,
  id,
  disabled,
  invalid,
}: {
  value: string | null;
  onChange: (organizationId: string | null) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const organizations = useOrganizationsStats();
  const rows = [...(organizations.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Select
      value={value ?? NO_ORGANIZATION}
      onValueChange={(v) => onChange(v === NO_ORGANIZATION ? null : v)}
      disabled={(disabled ?? false) || organizations.isPending}
    >
      <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
        <Building2 className="text-muted-foreground" />
        <SelectValue placeholder="Choisir une organisation" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectItem value={NO_ORGANIZATION}>
            Aucune organisation <span className="text-muted-foreground">· vivier de l'exploitant</span>
          </SelectItem>
          {rows.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
              {o.isActive ? null : <span className="text-muted-foreground"> · désactivée</span>}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Filtre de liste : toutes / vivier sans organisation / une organisation. */
export function DriverOrganizationFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const organizations = useOrganizationsStats();
  const rows = [...(organizations.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-auto min-w-52">
        <Building2 className="text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectGroup>
          <SelectItem value={ALL_ORGANIZATIONS}>Toutes les organisations</SelectItem>
          <SelectItem value={NO_ORGANIZATION}>Sans organisation (vivier)</SelectItem>
          {rows.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * Véhicule d'un conducteur. Rattaché à une organisation, il ne conduit que
 * ses véhicules : la liste est filtrée. Sans organisation, tout véhicule est
 * proposé (l'API l'accepte pour le vivier).
 */
export function DriverVehicleSelect({
  organizationId,
  value,
  onChange,
  id,
  disabled,
}: {
  organizationId: string | null;
  value: string | null;
  onChange: (vehicleId: string | null) => void;
  id?: string;
  disabled?: boolean;
}) {
  const vehicles = useVehicles({ page: 1, perPage: 100, organizationId: organizationId ?? undefined });
  const rows = vehicles.data?.data ?? [];
  const known = value === null || rows.some((v) => v.id === value);

  return (
    <Select
      value={value ?? NO_VEHICLE}
      onValueChange={(v) => onChange(v === NO_VEHICLE ? null : v)}
      disabled={(disabled ?? false) || vehicles.isPending}
    >
      <SelectTrigger id={id} className="w-full">
        <Truck className="text-muted-foreground" />
        <SelectValue placeholder={vehicles.isPending ? "Chargement…" : "Choisir un véhicule"} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectItem value={NO_VEHICLE}>Aucun véhicule</SelectItem>
          {known ? null : <SelectItem value={value as string}>Véhicule actuel</SelectItem>}
          {rows.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.registration}
              {organizationId ? null : v.organization ? (
                <span className="text-muted-foreground"> · {v.organization.name}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
