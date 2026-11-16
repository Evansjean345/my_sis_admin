"use client";

import { ArrowUpDown, RefreshCw, Search, SlidersHorizontal } from "lucide-react";

import { deviceStatusMeta } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/components/ui/input-group";
import { OrganizationFilter } from "@shared/features/common/organization/organization-select";
import { DEVICE_STATUSES, type DeviceStatus } from "@shared/types/device";

export type DeviceSort = "imei" | "created" | "status";

interface DeviceToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: DeviceStatus | "all";
  onStatusChange: (value: DeviceStatus | "all") => void;
  unassigned: boolean;
  onUnassignedChange: (value: boolean) => void;
  sort: DeviceSort;
  onSortChange: (value: DeviceSort) => void;
  refreshing: boolean;
  onRefresh: () => void;
  /** Filtre admin : une seule organisation (absent = toutes). */
  organizationId: string | undefined;
  onOrganizationChange: (value: string | undefined) => void;
}

export function DeviceToolbar(props: DeviceToolbarProps) {
  const trimmed = props.search.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="flex flex-col gap-1 md:max-w-lg md:flex-1">
        <InputGroup>
          <InputGroupInput
            placeholder="Rechercher par IMEI (3 caractères min.)…"
            aria-label="Rechercher un tracker"
            inputMode="numeric"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        {tooShort ? <span className="text-muted-foreground text-xs">Saisissez au moins 3 chiffres.</span> : null}
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
        <OrganizationFilter value={props.organizationId} onChange={props.onOrganizationChange} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal data-icon="inline-start" />
              Filtrer et trier
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Afficher</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={props.unassigned}
                onCheckedChange={(v) => props.onUnassignedChange(Boolean(v))}
              >
                En stock, non montés
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SlidersHorizontal />
                  Statut
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuRadioGroup
                    value={props.status}
                    onValueChange={(v) => props.onStatusChange(v as DeviceStatus | "all")}
                  >
                    <DropdownMenuRadioItem value="all">Tous les statuts</DropdownMenuRadioItem>
                    {DEVICE_STATUSES.map((s) => (
                      <DropdownMenuRadioItem key={s} value={s}>
                        {deviceStatusMeta[s].label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown />
                  Trier par
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuRadioGroup value={props.sort} onValueChange={(v) => props.onSortChange(v as DeviceSort)}>
                    <DropdownMenuRadioItem value="imei">IMEI</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created">Date d'enregistrement</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="status">Statut</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={props.onRefresh} disabled={props.refreshing}>
          <RefreshCw data-icon="inline-start" className={props.refreshing ? "animate-spin" : undefined} />
          Actualiser
        </Button>
      </div>
    </div>
  );
}
