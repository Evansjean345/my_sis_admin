"use client";

import { History, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { commandStatusMeta, commandTypeLabel } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip";
import { useCancelCommand, useCommandHistory, useSyncCommands } from "@shared/hooks/api/use-commands";
import { getErrorMessage } from "@shared/lib/axios";
import { formatDateTime } from "@shared/lib/format";

function commandCode(safety: Record<string, unknown>): string | null {
  const cmd = safety.flespiCommand as
    | { name?: string; properties?: { command_code?: string; data?: string } }
    | undefined;
  if (!cmd) return null;
  if (cmd.properties?.command_code) {
    return `${cmd.properties.command_code}${cmd.properties.data ? ` ${cmd.properties.data}` : ""}`;
  }
  return cmd.name ?? null;
}

export function CommandHistoryTable({ deviceId, enabled = true }: { deviceId: string; enabled?: boolean }) {
  const history = useCommandHistory(deviceId, enabled);
  const sync = useSyncCommands();
  const cancel = useCancelCommand();

  function handleSync() {
    sync.mutate(deviceId, {
      onSuccess: (r) =>
        toast.success("Commandes synchronisées", {
          description: `${r.acknowledged} acquittée(s), ${r.failed} en échec, ${r.expired} expirée(s), ${r.stillPending} en attente.`,
        }),
      onError: (error) => toast.error("Synchronisation impossible", { description: getErrorMessage(error) }),
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Historique des commandes</CardTitle>
        <CardDescription>50 dernières commandes émises vers ce tracker.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={handleSync} disabled={sync.isPending || !enabled}>
            <RefreshCw data-icon="inline-start" className={sync.isPending ? "animate-spin" : undefined} />
            Synchroniser
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {history.isPending && enabled ? (
          <LoadingRows rows={4} />
        ) : history.isError ? (
          <div className="px-4">
            <ErrorState error={history.error} onRetry={() => history.refetch()} />
          </div>
        ) : !history.data?.length ? (
          <div className="px-4">
            <EmptyState
              icon={<History />}
              title="Aucune commande"
              description="Aucune commande n'a encore été émise."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Motif</TableHead>
                  <TableHead>Demandée</TableHead>
                  <TableHead className="hidden lg:table-cell">Acquittée / échec</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.map((entry) => {
                  const meta = commandStatusMeta(entry.status);
                  const code = commandCode(entry.safety_context ?? {});
                  const inFlight = entry.status === "queued" || entry.status === "sent";
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{commandTypeLabel(entry.command_type)}</span>
                          {code ? <span className="font-mono text-muted-foreground text-xs">{code}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.error_message ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">{entry.error_message}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell
                        className="hidden max-w-64 truncate text-muted-foreground md:table-cell"
                        title={entry.reason}
                      >
                        {entry.reason}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDateTime(entry.requested_at)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                        {formatDateTime(entry.acknowledged_at ?? entry.failed_at)}
                      </TableCell>
                      <TableCell>
                        {inFlight ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Annuler la commande"
                            disabled={cancel.isPending}
                            onClick={() =>
                              cancel.mutate(
                                { deviceId, commandId: entry.id },
                                {
                                  onSuccess: () => toast.success("Commande annulée"),
                                  onError: (error) =>
                                    toast.error("Annulation impossible", { description: getErrorMessage(error) }),
                                },
                              )
                            }
                          >
                            <X />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
