"use client";

import { useState } from "react";

import Link from "next/link";

import { CalendarClock, Plus, Unlink } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  useAttachScheduleGroups,
  useDetachScheduleGroup,
  useGroupSchedules,
  useSchedules,
} from "@/hooks/api/use-schedules";
import { getErrorMessage } from "@/lib/axios";
import { SCHEDULE_MODES, type ScheduleMode, scheduleModeHints, scheduleModeLabels } from "@/types/schedule";

import { ModeBadge } from "../schedules/schedule-badges";

interface GroupSchedulesCardProps {
  groupId: string;
  groupName: string;
  organizationId: string;
}

/**
 * Immobilisation contrôlée d'une flotte : les calendriers rattachés au groupe
 * s'appliquent à chacun de ses véhicules (y compris ceux ajoutés plus tard).
 */
export function GroupSchedulesCard({ groupId, groupName, organizationId }: GroupSchedulesCardProps) {
  const schedules = useGroupSchedules(groupId);
  const available = useSchedules({ organizationId, perPage: 100 });
  const attach = useAttachScheduleGroups();
  const detach = useDetachScheduleGroup();

  const [scheduleId, setScheduleId] = useState<string>("");
  const [mode, setMode] = useState<ScheduleMode>("allowed");
  const [toDetach, setToDetach] = useState<{ id: string; name: string } | null>(null);

  const attachedIds = new Set((schedules.data ?? []).map((s) => s.id));
  const candidates = (available.data?.data ?? []).filter((s) => !attachedIds.has(s.id));

  function apply() {
    if (!scheduleId) return;
    attach.mutate(
      { id: scheduleId, groupIds: [groupId], mode },
      {
        onSuccess: (change) => {
          if (change.rejected.length > 0) {
            toast.error("Calendrier refusé", {
              description: "La flotte n'appartient pas à l'organisation du calendrier.",
            });
            return;
          }
          toast.success(`Calendrier appliqué à ${groupName}`);
          setScheduleId("");
        },
        onError: (error) => toast.error("Rattachement impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Horaires de la flotte</CardTitle>
        <CardDescription>
          Les véhicules de la flotte sont coupés hors des plages autorisées (ou pendant les plages interdites).
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/clock" prefetch={false}>
              Calendriers
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {schedules.isPending ? (
          <LoadingRows rows={2} className="flex flex-col gap-2" />
        ) : schedules.isError ? (
          <ErrorState error={schedules.error} onRetry={() => schedules.refetch()} />
        ) : schedules.data.length === 0 ? (
          <EmptyState
            icon={<CalendarClock />}
            title="Aucun calendrier"
            description="Cette flotte circule sans restriction horaire."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {schedules.data.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/clock/${s.id}`}
                    prefetch={false}
                    className="truncate font-medium text-sm hover:underline"
                  >
                    {s.name}
                  </Link>
                  <ModeBadge mode={s.mode} />
                  {s.isActive ? null : (
                    <StatusBadge tone="neutral" dot={false}>
                      Suspendu
                    </StatusBadge>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setToDetach({ id: s.id, name: s.name })}>
                  <Unlink data-icon="inline-start" />
                  Retirer
                </Button>
              </li>
            ))}
          </ul>
        )}

        <FieldGroup className="gap-3 border-t pt-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
            <Field className="gap-1.5">
              <FieldLabel>Appliquer un calendrier</FieldLabel>
              <Select value={scheduleId} onValueChange={setScheduleId} disabled={available.isPending}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={candidates.length ? "Choisir un calendrier" : "Aucun calendrier disponible"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {candidates.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.isActive ? "" : " (suspendu)"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field className="gap-1.5">
              <FieldLabel>Les plages sont</FieldLabel>
              <Select value={mode} onValueChange={(v) => setMode(v as ScheduleMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SCHEDULE_MODES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {scheduleModeLabels[m]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Button onClick={apply} disabled={!scheduleId || attach.isPending}>
              {attach.isPending ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
              Appliquer
            </Button>
          </div>
          <FieldDescription>{scheduleModeHints[mode]}</FieldDescription>
        </FieldGroup>
      </CardContent>

      <ConfirmDialog
        open={Boolean(toDetach)}
        onOpenChange={(open) => !open && setToDetach(null)}
        title="Retirer ce calendrier ?"
        description={`« ${toDetach?.name ?? ""} » ne s'appliquera plus aux véhicules de ${groupName}. Les moteurs coupés par ce calendrier seront rétablis au prochain passage du moteur, sauf coupure manuelle.`}
        confirmLabel="Retirer"
        destructive
        loading={detach.isPending}
        onConfirm={() => {
          if (!toDetach) return;
          detach.mutate(
            { id: toDetach.id, groupId },
            {
              onSuccess: () => {
                toast.success("Calendrier retiré");
                setToDetach(null);
              },
              onError: (error) => toast.error("Retrait impossible", { description: getErrorMessage(error) }),
            },
          );
        }}
      />
    </Card>
  );
}
