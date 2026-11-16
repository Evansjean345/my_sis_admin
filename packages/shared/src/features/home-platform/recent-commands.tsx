"use client";

import Link from "next/link";

import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { commandStatusMeta, commandTypeLabel } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { useAdminCommands } from "@shared/hooks/api/use-admin";
import { formatDateTime, formatNumber, formatRelative } from "@shared/lib/format";
import type { AdminStatsParams } from "@shared/types/admin";

/** Journal des dernières commandes, toutes organisations (ou celle du filtre). */
export function RecentCommands({ filter }: { filter: AdminStatsParams }) {
  const recent = useAdminCommands({ ...filter, page: 1, perPage: 8 });
  // Colonne « Organisation » : utile à la plateforme seulement (niveaux 2 et 3 = une seule).
  const showOrganization = useOptionalAccess()?.isPlatform ?? true;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dernières commandes</CardTitle>
        <CardDescription>Rafraîchi toutes les 20 s · un clic ouvre le boîtier</CardDescription>
        {recent.data ? (
          <CardAction className="text-muted-foreground text-sm tabular-nums">
            {formatNumber(recent.data.meta.total)} au total
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="px-0">
        {recent.isPending ? (
          <LoadingRows rows={6} />
        ) : recent.isError ? (
          <div className="px-6">
            <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
          </div>
        ) : recent.data.data.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted-foreground text-sm">Aucune commande enregistrée.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Commande</TableHead>
                {showOrganization ? <TableHead>Organisation</TableHead> : null}
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Motif</TableHead>
                <TableHead className="pr-6 text-right">Demandée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.data.data.map((cmd) => {
                const m = commandStatusMeta(cmd.status);
                return (
                  <TableRow key={cmd.id}>
                    <TableCell className="pl-6">
                      <Button variant="link" className="h-auto p-0 font-medium" asChild>
                        <Link prefetch={false} href={`/dashboard/device/${cmd.deviceId}`}>
                          {commandTypeLabel(cmd.commandType)}
                        </Link>
                      </Button>
                      {cmd.errorMessage ? (
                        <p className="max-w-56 truncate text-destructive text-xs" title={cmd.errorMessage}>
                          {cmd.errorMessage}
                        </p>
                      ) : null}
                    </TableCell>
                    {showOrganization ? (
                      <TableCell className="max-w-40 truncate">{cmd.organization?.name ?? "—"}</TableCell>
                    ) : null}
                    <TableCell>
                      <StatusBadge tone={m.tone}>{m.label}</StatusBadge>
                    </TableCell>
                    <TableCell
                      className="hidden max-w-80 truncate text-muted-foreground lg:table-cell"
                      title={cmd.reason}
                    >
                      {cmd.reason}
                    </TableCell>
                    <TableCell
                      className="pr-6 text-right text-muted-foreground"
                      title={formatDateTime(cmd.requestedAt)}
                    >
                      {formatRelative(cmd.requestedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
