"use client";

import { useState } from "react";

import { Info, ShieldAlert } from "lucide-react";

import { Can } from "@shared/components/providers/access-provider";
import { StatusBadge } from "@shared/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { CommandDialog } from "@shared/features/common/commands/command-dialog";
import { notifyCommandError, notifyCommandResult } from "@shared/features/common/commands/command-feedback";
import { CommandHistoryTable } from "@shared/features/common/commands/command-history-table";
import { SecurityActions } from "@shared/features/common/commands/security-actions";
import {
  type BusinessCommandConfig,
  COMMAND_GROUP_LABELS,
  ENABLED_COMMANDS,
} from "@shared/features/device/command-config";
import { RawCommandCard } from "@shared/features/device/detail/raw-command-card";
import { useCommandCatalog, useRunCommand } from "@shared/hooks/api/use-commands";
import { useVehicle } from "@shared/hooks/api/use-vehicles";
import type { DeviceDetail } from "@shared/types/device";

export function CommandsTab({ device }: { device: DeviceDetail }) {
  const linked = Boolean(device.flespiDeviceId);
  const catalog = useCommandCatalog(device.id);
  const run = useRunCommand();
  const vehicle = useVehicle(device.assignment?.id);
  const [selected, setSelected] = useState<BusinessCommandConfig | null>(null);

  const verified = new Map((catalog.data ?? []).map((c) => [c.name, c.verified]));
  const groups = Object.entries(
    ENABLED_COMMANDS.reduce<Record<string, BusinessCommandConfig[]>>((acc, cmd) => {
      acc[cmd.group] = [...(acc[cmd.group] ?? []), cmd];
      return acc;
    }, {}),
  ) as Array<[BusinessCommandConfig["group"], BusinessCommandConfig[]]>;

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info className="size-4" />
        <AlertTitle>Chaque commande est synchronisée</AlertTitle>
        <AlertDescription>
          Après l'envoi, l'état est réconcilié avec flespi (acquittée, échec, expirée). Limite : 10 commandes par
          minute. Le motif est obligatoire.
        </AlertDescription>
      </Alert>

      {device.assignment ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4" />
              Sécurité du véhicule {device.assignment.registration}
            </CardTitle>
            <CardDescription>
              Coupure et rétablissement du carburant — contrôle de vitesse et de fraîcheur de position côté serveur.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {vehicle.isPending ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              <SecurityActions
                vehicleId={device.assignment.id}
                deviceId={device.id}
                hasRelay={device.hasRelay}
                immobilizationEnabled={vehicle.data?.immobilizationEnabled ?? false}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Commandes boîtier : `vehicle:write` (administrateur). L'opérateur garde la coupure moteur ci-dessus. */}
      <Can permission="vehicle:write">
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map(([group, commands]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle>{COMMAND_GROUP_LABELS[group]}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y">
                {commands.map((cmd) => {
                  const Icon = cmd.icon;
                  const isVerified = verified.get(cmd.apiName);
                  return (
                    <div
                      key={`${cmd.slug}-${cmd.label}`}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="flex flex-wrap items-center gap-1.5 font-medium text-sm">
                          {cmd.label}
                          <code className="font-normal text-muted-foreground text-xs">{cmd.code}</code>
                          {isVerified === false ? (
                            <StatusBadge tone="warning" dot={false}>
                              non vérifiée
                            </StatusBadge>
                          ) : null}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">{cmd.description}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={cmd.warning ? "outline" : "secondary"}
                        disabled={!linked || run.isPending}
                        onClick={() => setSelected(cmd)}
                      >
                        Envoyer
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </Can>

      {/* Commande flespi brute : exploitant seulement (403 E_PLATFORM_ONLY sur l'API d'organisation). */}
      <Can levels={[1]}>{linked ? <RawCommandCard deviceId={device.id} /> : null}</Can>

      <CommandHistoryTable deviceId={device.id} />

      <CommandDialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.label ?? ""}
        description={selected ? `${selected.description} (code ${selected.code})` : undefined}
        requiresData={Boolean(selected?.requiresData)}
        dataLabel={selected?.dataLabel}
        dataPlaceholder={selected?.dataPlaceholder}
        dataHint={selected?.dataHint}
        warning={selected?.warning}
        pending={run.isPending}
        onSubmit={({ reason, data }) => {
          if (!selected) return;
          const cmd = selected;
          run.mutate(
            { deviceId: device.id, slug: cmd.slug, params: { reason, data: cmd.presetData ?? data } },
            {
              onSuccess: (executed) => {
                notifyCommandResult(cmd.label, executed);
                setSelected(null);
              },
              onError: (error) => notifyCommandError(cmd.label, error),
            },
          );
        }}
      />
    </div>
  );
}
