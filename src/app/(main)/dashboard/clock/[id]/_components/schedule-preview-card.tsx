"use client";

import { useState } from "react";

import Link from "next/link";

import { FlaskConical, Info, RefreshCw } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSchedulePreview } from "@/hooks/api/use-schedules";
import { formatDateTime } from "@/lib/format";
import { usageCauseLabels } from "@/types/schedule";

import { OutcomeBadge, UsageBadge } from "../../../_components/schedules/schedule-badges";

/**
 * SIMULATION — ce que le moteur déciderait à un instant donné, pour chaque
 * véhicule qui suit ce calendrier (directement ou par sa flotte). Rien n'est
 * émis ni écrit : à utiliser avant d'activer ou de rattacher un calendrier.
 */
export function SchedulePreviewCard({ scheduleId }: { scheduleId: string }) {
  // `datetime-local` = heure du navigateur ; convertie en instant ISO pour l'API.
  const [local, setLocal] = useState("");
  const at = local ? new Date(local).toISOString() : undefined;
  const preview = useSchedulePreview(scheduleId, at);
  const rows = preview.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="size-4" />
          Simulation
        </CardTitle>
        <CardDescription>
          Décision du moteur à l'instant choisi, véhicule par véhicule. Aucune commande n'est émise.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center gap-2 px-4">
          <Input
            type="datetime-local"
            className="h-8 w-56"
            aria-label="Instant simulé"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={() => setLocal("")} disabled={!local}>
            Maintenant
          </Button>
          <Button size="sm" variant="ghost" onClick={() => preview.refetch()} disabled={preview.isFetching}>
            <RefreshCw data-icon="inline-start" className={preview.isFetching ? "animate-spin" : undefined} />
            Recalculer
          </Button>
          {preview.data ? (
            <span className="ml-auto text-muted-foreground text-xs">
              Évalué pour le {formatDateTime(preview.data.meta.evaluatedAt)}
            </span>
          ) : null}
        </div>

        {preview.data?.meta.note ? (
          <div className="px-4">
            <Alert>
              <Info />
              <AlertDescription>{preview.data.meta.note}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        {preview.isPending ? (
          <LoadingRows rows={4} />
        ) : preview.isError ? (
          <div className="px-4">
            <ErrorState error={preview.error} onRetry={() => preview.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4">
            <EmptyState
              icon={<FlaskConical />}
              title="Aucun véhicule concerné"
              description="Rattachez des véhicules ou des flottes pour voir l'effet du calendrier."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>État visé</TableHead>
                  <TableHead className="hidden md:table-cell">Raison</TableHead>
                  <TableHead className="hidden lg:table-cell">Calendrier décisif</TableHead>
                  <TableHead>Décision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.vehicleId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/vehicles/${e.vehicleId}`}
                        prefetch={false}
                        className="font-medium hover:underline"
                      >
                        {e.registration}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <UsageBadge state={e.desired} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {usageCauseLabels[e.cause]}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {e.schedule ? (
                        <span className="flex flex-col">
                          <span>{e.schedule.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {e.schedule.source === "vehicle"
                              ? "rattachement direct"
                              : `via la flotte ${e.schedule.source.replace(/^group:/, "")}`}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={e.outcome} action={e.action} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
