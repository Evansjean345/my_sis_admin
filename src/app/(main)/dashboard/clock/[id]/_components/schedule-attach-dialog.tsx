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
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useVehicleGroups } from "@/hooks/api/use-groups";
import { useAttachScheduleGroups, useAttachScheduleVehicles } from "@/hooks/api/use-schedules";
import { useVehicles } from "@/hooks/api/use-vehicles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getErrorMessage } from "@/lib/axios";
import { SCHEDULE_MODES, type ScheduleMode, scheduleModeHints, scheduleModeLabels } from "@/types/schedule";

export type TargetKind = "vehicles" | "groups";

interface Candidate {
  id: string;
  label: string;
  hint: string;
}

/**
 * Rattacher des véhicules ou des flottes à un calendrier, avec un MODE.
 *
 * Idempotent côté API : un rattachement existant avec un autre mode est
 * mis à jour (`updated`), avec le même mode il est ignoré (`unchanged`).
 * Seules les cibles de l'organisation du calendrier sont acceptées.
 */
export function ScheduleAttachDialog({
  kind,
  scheduleId,
  organizationId,
  currentIds,
  open,
  onOpenChange,
}: {
  kind: TargetKind;
  scheduleId: string;
  organizationId: string;
  currentIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<ScheduleMode>("allowed");
  const debounced = useDebouncedValue(search.trim());
  const attachVehicles = useAttachScheduleVehicles();
  const attachGroups = useAttachScheduleGroups();
  const pending = attachVehicles.isPending || attachGroups.isPending;

  const vehicles = useVehicles(
    { page: 1, perPage: 100, search: debounced || undefined, organizationId },
    { enabled: open && kind === "vehicles" },
  );
  const groups = useVehicleGroups(
    { page: 1, perPage: 100, search: debounced || undefined, organizationId },
    { enabled: open && kind === "groups" },
  );
  const query = kind === "vehicles" ? vehicles : groups;

  const candidates: Candidate[] = useMemo(() => {
    if (kind === "vehicles") {
      return (vehicles.data?.data ?? []).map((v) => ({
        id: v.id,
        label: v.registration,
        hint: [v.label, v.brand, v.model].filter(Boolean).join(" · ") || "—",
      }));
    }
    return (groups.data?.data ?? []).map((g) => ({
      id: g.id,
      label: g.name,
      hint: `${g.membersCount} véhicule(s)`,
    }));
  }, [kind, vehicles.data, groups.data]);

  const deja = useMemo(() => new Set(currentIds), [currentIds]);

  useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch("");
      setMode("allowed");
    }
  }, [open]);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  function submit() {
    const handlers = {
      onSuccess: (r: { applied: string[]; updated: string[]; unchanged: string[]; rejected: string[] }) => {
        const parts = [`${r.applied.length} rattaché(s)`];
        if (r.updated.length) parts.push(`${r.updated.length} mode modifié`);
        if (r.unchanged.length) parts.push(`${r.unchanged.length} inchangé(s)`);
        if (r.rejected.length) parts.push(`${r.rejected.length} refusé(s)`);
        toast.success("Rattachement enregistré", {
          description: `${parts.join(" · ")}. Appliqué au prochain passage du moteur.`,
        });
        onOpenChange(false);
      },
      onError: (error: unknown) => toast.error("Rattachement impossible", { description: getErrorMessage(error) }),
    };
    if (kind === "vehicles") attachVehicles.mutate({ id: scheduleId, vehicleIds: selected, mode }, handlers);
    else attachGroups.mutate({ id: scheduleId, groupIds: selected, mode }, handlers);
  }

  const noun = kind === "vehicles" ? "véhicules" : "flottes";

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Rattacher des {noun}</DialogTitle>
          <DialogDescription>
            {kind === "groups"
              ? "Tous les véhicules de la flotte, présents et futurs, suivront ce calendrier."
              : "Les véhicules sélectionnés suivront ce calendrier, en plus de ceux de leurs flottes."}
          </DialogDescription>
        </DialogHeader>

        <Field className="gap-2">
          <FieldLabel>Mode</FieldLabel>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setMode(v as ScheduleMode)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {SCHEDULE_MODES.map((m) => (
              <label
                key={m}
                htmlFor={`mode-${m}`}
                className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem id={`mode-${m}`} value={m} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{scheduleModeLabels[m]}</span>
                  <span className="text-muted-foreground text-xs">{scheduleModeHints[m]}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </Field>

        <InputGroup>
          <InputGroupInput
            placeholder={kind === "vehicles" ? "Rechercher une immatriculation…" : "Rechercher une flotte…"}
            aria-label={`Rechercher parmi les ${noun}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        {query.isPending ? (
          <LoadingRows rows={4} className="flex flex-col gap-2" />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : candidates.length === 0 ? (
          <EmptyState title={`Aucun(e) ${noun.slice(0, -1)}`} description="Rien dans l'organisation du calendrier." />
        ) : (
          <ScrollArea className="h-64 rounded-md border">
            <ul className="divide-y">
              {candidates.map((c) => {
                const rattache = deja.has(c.id);
                return (
                  <li key={c.id}>
                    <label
                      htmlFor={`target-${c.id}`}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`target-${c.id}`}
                        checked={selected.includes(c.id)}
                        onCheckedChange={() => toggle(c.id)}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-sm">{c.label}</span>
                        <span className="truncate text-muted-foreground text-xs">{c.hint}</span>
                      </span>
                      {rattache ? (
                        <span className="ml-auto text-muted-foreground text-xs">déjà rattaché · changer le mode</span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        <DialogFooter className="sm:justify-between">
          <span className="text-muted-foreground text-sm tabular-nums">{selected.length} sélectionné(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button disabled={selected.length === 0 || pending} onClick={submit}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Rattacher
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
