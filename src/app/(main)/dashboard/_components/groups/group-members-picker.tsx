"use client";

import { useEffect, useMemo, useState } from "react";

import { Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useDevices } from "@/hooks/api/use-devices";
import { useDrivers } from "@/hooks/api/use-drivers";
import { useAssignGroupMembers } from "@/hooks/api/use-groups";
import { useVehicles } from "@/hooks/api/use-vehicles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/axios";
import { MAX_GROUP_MEMBERS } from "@/types/group";

import type { GroupFamily } from "./group-family";

interface Candidate {
  id: string;
  label: string;
  hint: string;
}

/**
 * Sélection en lot des membres à affecter.
 *
 * L'affectation est idempotente côté API : réémettre une sélection déjà
 * en place n'est pas une erreur. On grise tout de même les membres déjà
 * présents — rien ne sert de les renvoyer, et le rapport reste lisible.
 */
export function GroupMembersPicker({
  family,
  groupId,
  organizationId,
  currentMemberIds,
  open,
  onOpenChange,
}: {
  family: GroupFamily;
  groupId: string;
  /** Organisation du groupe : l'API refuse tout membre d'une autre organisation. */
  organizationId: string;
  currentMemberIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const debounced = useDebouncedValue(search.trim());
  const assign = useAssignGroupMembers(family.kind);

  const searchParam = debounced.length >= family.memberSearchMinLength ? debounced : undefined;
  const kind = family.kind;

  // Les trois hooks sont appelés à chaque rendu — règle des hooks —, mais seul
  // celui de la famille courante déclenche une requête.
  const vehicles = useVehicles(
    { page: 1, perPage: 100, search: searchParam, organizationId },
    { enabled: open && kind === "vehicle_group" },
  );
  const devices = useDevices(
    { page: 1, perPage: 100, search: searchParam, organizationId },
    { enabled: open && kind === "device_group" },
  );
  const drivers = useDrivers(
    { page: 1, perPage: 100, search: searchParam, organizationId },
    { enabled: open && kind === "driver_group" },
  );
  const query = kind === "vehicle_group" ? vehicles : kind === "device_group" ? devices : drivers;

  const candidates: Candidate[] = useMemo(() => {
    if (kind === "vehicle_group") {
      return (vehicles.data?.data ?? []).map((vehicle) => ({
        id: vehicle.id,
        label: vehicle.registration,
        hint: [vehicle.label, vehicle.brand, vehicle.model].filter(Boolean).join(" · ") || "—",
      }));
    }
    if (kind === "driver_group") {
      return (drivers.data?.data ?? []).map((driver) => ({
        id: driver.id,
        label: driver.fullName,
        hint:
          [driver.employeeCode, driver.licenseNumber, driver.vehicle?.registration].filter(Boolean).join(" · ") || "—",
      }));
    }
    return (devices.data?.data ?? []).map((device) => ({
      id: device.id,
      label: device.imei,
      hint: [device.model, device.simMsisdn].filter(Boolean).join(" · ") || "—",
    }));
  }, [kind, vehicles.data, devices.data, drivers.data]);

  const members = useMemo(() => new Set(currentMemberIds), [currentMemberIds]);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch("");
    }
  }, [open]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function submit() {
    assign.mutate(
      { id: groupId, memberIds: selected },
      {
        onSuccess: (result) => {
          const parts = [`${result.applied.length} ajouté(s)`];
          if (result.unchanged.length > 0) parts.push(`${result.unchanged.length} déjà membre(s)`);
          if (result.rejected.length > 0) parts.push(`${result.rejected.length} refusé(s)`);
          toast.success("Affectation enregistrée", { description: parts.join(" · ") });
          onOpenChange(false);
        },
        onError: (error) => toast.error("Affectation impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  const tooMany = selected.length > MAX_GROUP_MEMBERS;

  return (
    <Dialog open={open} onOpenChange={(next) => !assign.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ajouter des {family.memberPlural}</DialogTitle>
          <DialogDescription>
            {`Sélectionnez jusqu'à ${MAX_GROUP_MEMBERS} ${family.memberPlural} à affecter à ce groupe.`}
          </DialogDescription>
        </DialogHeader>

        <InputGroup>
          <InputGroupInput
            placeholder={family.memberSearchPlaceholder}
            aria-label={`Rechercher parmi les ${family.memberPlural}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        {query.isPending ? (
          <LoadingRows rows={5} className="flex flex-col gap-2" />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={<family.memberIcon />}
            title={`Aucun ${family.memberSingular}`}
            description="Aucun résultat pour cette recherche."
          />
        ) : (
          <ScrollArea className="h-80 rounded-md border">
            <ul className="divide-y">
              {candidates.map((candidate) => {
                const isMember = members.has(candidate.id);
                const checked = isMember || selected.includes(candidate.id);
                return (
                  <li key={candidate.id}>
                    <label
                      htmlFor={`member-${candidate.id}`}
                      className={
                        isMember
                          ? "flex cursor-not-allowed items-center gap-3 px-3 py-2.5 opacity-60"
                          : "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                      }
                    >
                      <Checkbox
                        id={`member-${candidate.id}`}
                        checked={checked}
                        disabled={isMember}
                        onCheckedChange={() => toggle(candidate.id)}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-sm">{candidate.label}</span>
                        <span className="truncate text-muted-foreground text-xs">{candidate.hint}</span>
                      </span>
                      {isMember ? <span className="ml-auto text-muted-foreground text-xs">déjà membre</span> : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        <DialogFooter className="sm:justify-between">
          <span className="text-muted-foreground text-sm tabular-nums">
            {selected.length} sélectionné(s)
            {tooMany ? ` — maximum ${MAX_GROUP_MEMBERS}` : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={assign.isPending} onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button disabled={selected.length === 0 || tooMany || assign.isPending} onClick={submit}>
              {assign.isPending ? <Spinner data-icon="inline-start" /> : null}
              Affecter
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
