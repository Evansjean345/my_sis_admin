"use client";

import Link from "next/link";

import { CalendarClock, TriangleAlert } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useVehicleScheduleStatus } from "@/hooks/api/use-schedules";
import { formatDateTime } from "@/lib/format";
import { usageCauseLabels } from "@/types/schedule";

import { ModeBadge, OutcomeBadge, UsageBadge } from "../../../_components/schedules/schedule-badges";
import { WeekPreview } from "../../../_components/schedules/week-preview";

/**
 * Immobilisation planifiée du véhicule : calendriers qui s'appliquent (et
 * d'où ils viennent : direct ou flotte), état visé maintenant, mémoire du
 * moteur. C'est la réponse à « pourquoi ce moteur a-t-il été coupé à 22 h ? ».
 */
export function VehicleScheduleCard({ vehicleId }: { vehicleId: string }) {
  const status = useVehicleScheduleStatus(vehicleId);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Horaires</CardTitle>
        <CardDescription>Immobilisation planifiée par calendrier d'utilisation.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/clock" prefetch={false}>
              Calendriers
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {status.isPending ? (
          <LoadingRows rows={3} className="flex flex-col gap-2" />
        ) : status.isError ? (
          <ErrorState error={status.error} onRetry={() => status.refetch()} />
        ) : !status.data.managed || status.data.schedules.length === 0 ? (
          <EmptyState
            icon={<CalendarClock />}
            title="Aucun calendrier"
            description="Ce véhicule n'est soumis à aucune restriction horaire. Rattachez-le (ou sa flotte) à un calendrier."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <UsageBadge state={status.data.verdict.state} />
              <span className="text-muted-foreground text-sm">{usageCauseLabels[status.data.verdict.cause]}</span>
            </div>

            {status.data.enforcement?.stored?.pendingAction ? (
              <Alert>
                <TriangleAlert />
                <AlertDescription>
                  {status.data.enforcement.stored.pendingAction === "cut" ? "Coupure" : "Rétablissement"} en attente
                  {status.data.enforcement.stored.lastErrorCode
                    ? ` — dernier refus : ${status.data.enforcement.stored.lastErrorMessage ?? status.data.enforcement.stored.lastErrorCode}`
                    : ""}
                  {status.data.enforcement.stored.nextAttemptAt
                    ? ` · nouvelle tentative ${formatDateTime(status.data.enforcement.stored.nextAttemptAt)}`
                    : ""}
                </AlertDescription>
              </Alert>
            ) : null}

            <ul className="flex flex-col gap-3">
              {status.data.schedules.map((s) => (
                <li
                  key={`${s.id}-${s.source.type === "group" ? s.source.groupId : "v"}`}
                  className="flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/clock/${s.id}`}
                      prefetch={false}
                      className="font-medium text-sm hover:underline"
                    >
                      {s.name}
                    </Link>
                    <ModeBadge mode={s.mode} />
                    <span className="text-muted-foreground text-xs">
                      {s.source.type === "group" ? `via la flotte ${s.source.groupName}` : "rattachement direct"}
                    </span>
                  </div>
                  <WeekPreview windows={s.windows} mode={s.mode} compact />
                </li>
              ))}
            </ul>

            {status.data.enforcement ? (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-muted-foreground text-xs">
                <span>Prochain passage du moteur :</span>
                <OutcomeBadge
                  outcome={status.data.enforcement.nextDecision.outcome}
                  action={status.data.enforcement.nextDecision.action}
                />
                {status.data.lastConfirmedEngineCommand ? (
                  <span>
                    · dernière commande confirmée :{" "}
                    {status.data.lastConfirmedEngineCommand.commandType === "engine_cut" ? "coupure" : "rétablissement"}{" "}
                    ({status.data.lastConfirmedEngineCommand.origin === "schedule" ? "calendrier" : "opérateur"},{" "}
                    {formatDateTime(status.data.lastConfirmedEngineCommand.at)})
                  </span>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
