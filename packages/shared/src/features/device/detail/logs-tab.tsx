"use client";

import { useMemo, useState } from "react";

import { Activity, RefreshCw, Unplug } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { flespiEventLabel } from "@shared/features/device/command-config";
import { useDeviceDiagnostic, useDeviceLogs } from "@shared/hooks/api/use-devices";
import { formatDateTime, formatRelative, fromFlespiTs } from "@shared/lib/format";
import type { FlespiLogEntry } from "@shared/types/device";

function detailOf(entry: FlespiLogEntry): string {
  if (entry.error_text) return entry.error_text;
  if (entry.response) return String(entry.response);
  const props = entry.properties as { command_code?: string; data?: string } | undefined;
  if (props?.command_code) return `${entry.name ?? "custom"} · ${props.command_code} ${props.data ?? ""}`.trim();
  if (entry.duration !== undefined) return `Durée ${entry.duration} s · code fermeture ${entry.close_code ?? "—"}`;
  return entry.source ?? entry.host ?? "";
}

export function LogsTab({ deviceId }: { deviceId: string }) {
  const [count, setCount] = useState(50);
  const logs = useDeviceLogs(deviceId, count);
  const diagnostic = useDeviceDiagnostic(deviceId);

  const sorted = useMemo(() => [...(logs.data ?? [])].sort((a, b) => b.timestamp - a.timestamp), [logs.data]);
  const errors = sorted.filter((e) => e.error_text).length;
  const lastMessageAt = diagnostic.data?.lastMessageAt ?? null;
  const online = lastMessageAt ? Date.now() - new Date(lastMessageAt).getTime() < 3600_000 : false;

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {online ? <Activity className="size-4 text-emerald-600" /> : <Unplug className="size-4 text-destructive" />}
            État de la connexion
          </CardTitle>
          <CardDescription>
            {diagnostic.isPending
              ? "Vérification…"
              : lastMessageAt
                ? `Dernière trame ${formatRelative(lastMessageAt)} (${formatDateTime(lastMessageAt)})`
                : "Aucune trame reçue par flespi."}
          </CardDescription>
          <CardAction>
            <StatusBadge tone={online ? "success" : lastMessageAt ? "warning" : "danger"}>
              {online ? "Connecté" : lastMessageAt ? "Inactif" : "Jamais connecté"}
            </StatusBadge>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Journal flespi</CardTitle>
          <CardDescription>
            Connexions, erreurs de décodage et commandes{errors ? ` · ${errors} erreur(s)` : ""}.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger size="sm" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {[20, 50, 100, 200].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => logs.refetch()} disabled={logs.isFetching}>
              <RefreshCw className={logs.isFetching ? "animate-spin" : undefined} />
              <span className="sr-only">Actualiser</span>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {logs.isPending ? (
            <LoadingRows rows={5} />
          ) : logs.isError ? (
            <div className="px-4">
              <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
            </div>
          ) : sorted.length === 0 ? (
            <div className="px-4">
              <EmptyState title="Journal vide" description="Aucun événement sur la période." />
            </div>
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Événement</TableHead>
                    <TableHead className="hidden md:table-cell">Transport</TableHead>
                    <TableHead>Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((entry, index) => (
                    <TableRow key={`${entry.id ?? "e"}-${entry.event_code}-${entry.timestamp}-${index}`}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-xs tabular-nums">
                        {formatDateTime(fromFlespiTs(entry.timestamp))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">{flespiEventLabel(entry.event_code)}</span>
                          <span className="font-mono text-muted-foreground text-xs">code {entry.event_code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground text-xs uppercase md:table-cell">
                        {entry.transport ?? "—"}
                      </TableCell>
                      <TableCell
                        className={`max-w-96 truncate font-mono text-xs ${entry.error_text ? "text-destructive" : entry.executed ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                        title={detailOf(entry)}
                      >
                        {detailOf(entry) || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
