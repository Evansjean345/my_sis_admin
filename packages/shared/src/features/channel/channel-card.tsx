"use client";

import { useEffect, useState } from "react";

import { cn } from "cn";
import {
  ChevronDown,
  CircleDashed,
  Clock3,
  Copy,
  Cpu,
  EllipsisVertical,
  FileText,
  Pencil,
  Radar,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shared/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { ChannelEditDialog } from "@shared/features/channel/channel-edit-dialog";
import { ChannelSheet, type ChannelSheetKind } from "@shared/features/channel/channel-sheet";
import { useChannelConnections, useDeleteChannel } from "@shared/hooks/api/use-flespi";
import { getErrorMessage } from "@shared/lib/axios";
import { formatDateTime, formatRelative, fromFlespiTs } from "@shared/lib/format";
import type { FlespiChannel } from "@shared/types/flespi";

export function ChannelCard({ channel, isProduction }: { channel: FlespiChannel; isProduction: boolean }) {
  const [open, setOpen] = useState(isProduction);
  const [sheet, setSheet] = useState<ChannelSheetKind | null>(null);
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const remove = useDeleteChannel();

  // Le canal de production n'est connu qu'après /flespi/health : on le déplie à ce moment-là.
  useEffect(() => {
    if (isProduction) setOpen(true);
  }, [isProduction]);

  function copyUri() {
    navigator.clipboard
      .writeText(channel.uri)
      .then(() => toast.success("URI copiée", { description: channel.uri }))
      .catch(() => toast.error("Copie impossible"));
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col overflow-hidden rounded-xl border bg-card py-3 text-card-foreground data-[state=open]:gap-3 data-[state=open]:pb-0"
    >
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="group -ml-2 h-auto w-full justify-start gap-2 px-2 py-1 hover:bg-transparent aria-expanded:bg-transparent sm:flex-1"
          >
            <ChevronDown className="group-data-[state=open]:rotate-180" />
            <div className="flex min-w-0 flex-wrap items-baseline gap-1.5 text-left">
              <span className="shrink-0 font-medium leading-none">{channel.name}</span>
              <span className="min-w-0 truncate font-mono text-muted-foreground text-sm">({channel.id})</span>
              {isProduction ? (
                <Badge
                  variant="secondary"
                  className="rounded-sm bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400"
                >
                  Production
                </Badge>
              ) : null}
              <Badge
                variant={channel.enabled ? "secondary" : "destructive"}
                className={cn(
                  "rounded-sm px-1.5 py-0.5",
                  channel.enabled && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                )}
              >
                {channel.enabled ? "Actif" : "Désactivé"}
              </Badge>
            </div>
          </Button>
        </CollapsibleTrigger>
        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button variant="ghost" size="sm" className="-ml-1.5 font-mono sm:ml-0" onClick={copyUri}>
            <Copy data-icon="inline-start" />
            {channel.uri}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label={`Actions du canal ${channel.name}`}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSheet("logs")}>
                  <FileText />
                  Voir les logs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSheet("idents")}>
                  <Radar />
                  Trackers vus sur le canal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSheet("types")}>
                  <Cpu />
                  Types de trackers supportés
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setDialog("edit")}>
                  <Pencil />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                  <Trash2 />
                  Supprimer le canal
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>{open ? <ConnectionsTable channel={channel} /> : null}</CollapsibleContent>

      <ChannelSheet channel={channel} kind={sheet} onOpenChange={(o) => !o && setSheet(null)} />
      <ChannelEditDialog channel={channel} open={dialog === "edit"} onOpenChange={(o) => !o && setDialog(null)} />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Supprimer le canal ${channel.name} ?`}
        description={
          isProduction
            ? "Ce canal est le canal de PRODUCTION : sa suppression déconnecterait toute la flotte. L'API refusera la suppression."
            : "Les boîtiers programmés sur ce canal ne pourront plus transmettre. Action irréversible."
        }
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(channel.id, {
            onSuccess: () => {
              toast.success("Canal supprimé", { description: channel.name });
              setDialog(null);
            },
            onError: (error) => {
              toast.error("Suppression refusée", { description: getErrorMessage(error) });
              setDialog(null);
            },
          })
        }
      />
    </Collapsible>
  );
}

function ConnectionsTable({ channel }: { channel: FlespiChannel }) {
  const connections = useChannelConnections(channel.id);

  if (connections.isPending) return <LoadingRows rows={2} className="flex flex-col gap-2 border-t p-4" />;
  if (connections.isError) {
    return (
      <div className="border-t p-4">
        <ErrorState error={connections.error} onRetry={() => connections.refetch()} />
      </div>
    );
  }
  if (connections.data.length === 0) {
    return (
      <div className="flex min-h-24 items-center justify-center border-t bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <CircleDashed className="size-4" />
          <p className="font-medium text-sm">Aucune connexion TCP active sur ce canal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin overflow-x-auto [scrollbar-color:var(--border)_transparent] **:data-[slot=table-container]:overflow-visible">
      <Table className="min-w-[900px] **:data-[slot='table-cell']:px-5 **:data-[slot='table-head']:px-5">
        <TableHeader className="bg-muted/50 [&_tr]:border-y">
          <TableRow>
            <TableHead className="font-medium">Ident</TableHead>
            <TableHead>Device flespi</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Transport</TableHead>
            <TableHead>Connecté depuis</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="**:data-[slot='table-row']:hover:bg-transparent">
          {connections.data.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <span className="block truncate font-medium font-mono">{c.ident ?? "inconnu"}</span>
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">{c.device_id ?? "—"}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{c.source}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="rounded-sm px-1.5 py-0.5 uppercase">
                  {c.transport}
                </Badge>
              </TableCell>
              <TableCell>
                <span
                  className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums"
                  title={formatDateTime(fromFlespiTs(c.established))}
                >
                  <Clock3 className="size-4" />
                  {formatRelative(fromFlespiTs(c.established))}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Settings className="size-4" />
                  {c.secondary ? "Secondaire" : "Principale"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
