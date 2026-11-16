"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeftRight, Plus, SquareParking, Truck, Unlink } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { Can } from "@shared/components/providers/access-provider";
import { EmptyState } from "@shared/components/query-state";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip";
import { ScheduleAttachDialog, type TargetKind } from "@shared/features/clock/detail/schedule-attach-dialog";
import { ModeBadge } from "@shared/features/common/schedules/schedule-badges";
import {
  useAttachScheduleGroups,
  useAttachScheduleVehicles,
  useDetachScheduleGroup,
  useDetachScheduleVehicle,
} from "@shared/hooks/api/use-schedules";
import { getErrorMessage } from "@shared/lib/axios";
import { formatDate } from "@shared/lib/format";
import { type ScheduleMode, type ScheduleTarget, scheduleModeLabels } from "@shared/types/schedule";

/**
 * Véhicules OU flottes rattachés à un calendrier : mode, changement de mode,
 * détachement. Détacher n'émet aucune commande immédiate : le moteur rétablit
 * au prochain passage ce qu'il avait coupé, s'il ne relève d'aucun autre calendrier.
 */
export function ScheduleTargetsCard({
  kind,
  scheduleId,
  organizationId,
  targets,
}: {
  kind: TargetKind;
  scheduleId: string;
  organizationId: string;
  targets: ScheduleTarget[];
}) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [detaching, setDetaching] = useState<ScheduleTarget | null>(null);
  const detachVehicle = useDetachScheduleVehicle();
  const detachGroup = useDetachScheduleGroup();
  const attachVehicles = useAttachScheduleVehicles();
  const attachGroups = useAttachScheduleGroups();

  const isVehicles = kind === "vehicles";
  const Icon = isVehicles ? Truck : SquareParking;
  const route = isVehicles ? "/dashboard/vehicles" : "/dashboard/group_vehicle";

  function switchMode(target: ScheduleTarget) {
    const mode: ScheduleMode = target.mode === "allowed" ? "forbidden" : "allowed";
    const handlers = {
      onSuccess: () =>
        toast.success("Mode modifié", { description: `${target.label} : ${scheduleModeLabels[mode].toLowerCase()}` }),
      onError: (error: unknown) => toast.error("Modification impossible", { description: getErrorMessage(error) }),
    };
    if (isVehicles) attachVehicles.mutate({ id: scheduleId, vehicleIds: [target.id], mode }, handlers);
    else attachGroups.mutate({ id: scheduleId, groupIds: [target.id], mode }, handlers);
  }

  function detach() {
    if (!detaching) return;
    const handlers = {
      onSuccess: () => {
        toast.success("Rattachement retiré", { description: detaching.label });
        setDetaching(null);
      },
      onError: (error: unknown) => toast.error("Retrait impossible", { description: getErrorMessage(error) }),
    };
    if (isVehicles) detachVehicle.mutate({ id: scheduleId, vehicleId: detaching.id }, handlers);
    else detachGroup.mutate({ id: scheduleId, groupId: detaching.id }, handlers);
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{isVehicles ? "Véhicules rattachés" : "Flottes rattachées"}</CardTitle>
        <CardDescription>
          {isVehicles
            ? "Rattachement direct. Un véhicule suit aussi les calendriers de ses flottes."
            : "Immobilisation contrôlée d'une flotte : tous ses véhicules, présents et futurs, suivent ce calendrier."}
        </CardDescription>
        <CardAction>
          <Can permission="policy:write">
            <Button size="sm" onClick={() => setAttachOpen(true)}>
              <Plus data-icon="inline-start" />
              Rattacher
            </Button>
          </Can>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {targets.length === 0 ? (
          <div className="px-4">
            <EmptyState
              icon={<Icon />}
              title={isVehicles ? "Aucun véhicule" : "Aucune flotte"}
              description="Ce calendrier ne s'applique encore à rien ici."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{isVehicles ? "Immatriculation" : "Flotte"}</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="hidden sm:table-cell">Depuis</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link href={`${route}/${t.id}`} prefetch={false} className="font-medium hover:underline">
                        {t.label}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ModeBadge mode={t.mode} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Can permission="policy:write">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                aria-label={`Inverser le mode de ${t.label}`}
                                disabled={attachVehicles.isPending || attachGroups.isPending}
                                onClick={() => switchMode(t)}
                              >
                                <ArrowLeftRight />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Passer en « {scheduleModeLabels[t.mode === "allowed" ? "forbidden" : "allowed"]} »
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Détacher ${t.label}`}
                            onClick={() => setDetaching(t)}
                          >
                            <Unlink />
                          </Button>
                        </div>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <ScheduleAttachDialog
        kind={kind}
        scheduleId={scheduleId}
        organizationId={organizationId}
        currentIds={targets.map((t) => t.id)}
        open={attachOpen}
        onOpenChange={setAttachOpen}
      />
      <ConfirmDialog
        open={detaching !== null}
        onOpenChange={(o) => !o && setDetaching(null)}
        title={`Détacher ${detaching?.label ?? ""} ?`}
        description="Aucune commande n'est émise maintenant. Au prochain passage, le moteur rétablit ce qu'il avait coupé, sauf si un autre calendrier s'applique encore."
        confirmLabel="Détacher"
        loading={detachVehicle.isPending || detachGroup.isPending}
        onConfirm={detach}
      />
    </Card>
  );
}
