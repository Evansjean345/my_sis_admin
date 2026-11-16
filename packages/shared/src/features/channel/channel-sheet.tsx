"use client";

import { useState } from "react";

import Link from "next/link";

import { RefreshCw, Search } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge, type StatusTone } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@shared/components/ui/sheet";
import { flespiEventLabel } from "@shared/features/device/command-config";
import {
  useChannelIdents,
  useChannelLogs,
  useDeviceTypes,
  useFlespiHealth,
  useProtocols,
} from "@shared/hooks/api/use-flespi";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { formatDateTime, formatRelative, fromFlespiTs } from "@shared/lib/format";
import type { FlespiChannel, SeenIdentStatus } from "@shared/types/flespi";

export type ChannelSheetKind = "logs" | "idents" | "types";

const TITLES: Record<ChannelSheetKind, string> = {
  logs: "Journal du canal",
  idents: "Trackers vus sur le canal",
  types: "Types de trackers supportés",
};

export function ChannelSheet({
  channel,
  kind,
  onOpenChange,
}: {
  channel: FlespiChannel;
  kind: ChannelSheetKind | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={Boolean(kind)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {kind ? (
          <>
            <SheetHeader>
              <SheetTitle>{TITLES[kind]}</SheetTitle>
              <SheetDescription>
                {channel.name} · <span className="font-mono">{channel.uri}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              {kind === "logs" ? <LogsPanel channelId={channel.id} /> : null}
              {kind === "idents" ? <IdentsPanel channelId={channel.id} /> : null}
              {kind === "types" ? <TypesPanel protocolId={channel.protocol_id} /> : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function LogsPanel({ channelId }: { channelId: number }) {
  const logs = useChannelLogs(channelId, 50);
  if (logs.isPending) return <LoadingRows rows={6} className="flex flex-col gap-2" />;
  if (logs.isError) return <ErrorState error={logs.error} onRetry={() => logs.refetch()} />;
  const entries = [...logs.data].sort((a, b) => b.timestamp - a.timestamp);
  if (entries.length === 0) return <EmptyState title="Journal vide" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => logs.refetch()} disabled={logs.isFetching}>
          <RefreshCw data-icon="inline-start" className={logs.isFetching ? "animate-spin" : undefined} />
          Actualiser
        </Button>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border">
        {entries.map((e, index) => (
          <li key={`${e.id ?? "log"}-${e.timestamp}-${index}`} className="flex flex-col gap-1 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{flespiEventLabel(e.event_code)}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatDateTime(fromFlespiTs(e.timestamp))}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
              {e.source ? <span className="font-mono">{e.source}</span> : null}
              {e.duration !== undefined ? <span>durée {e.duration} s</span> : null}
              {typeof e.msgs === "number" ? <span>{e.msgs} message(s)</span> : null}
              {typeof e.recv === "number" ? <span>{e.recv} octets reçus</span> : null}
            </div>
            {e.error_text ? <code className="break-all text-destructive text-xs">{e.error_text}</code> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

const identMeta: Record<SeenIdentStatus, { label: string; tone: StatusTone }> = {
  registered: { label: "Enregistré", tone: "success" },
  flespi_only: { label: "Flespi uniquement", tone: "warning" },
  unregistered: { label: "Non enregistré", tone: "danger" },
};

function IdentsPanel({ channelId }: { channelId: number }) {
  const idents = useChannelIdents(channelId);
  if (idents.isPending) return <LoadingRows rows={5} className="flex flex-col gap-2" />;
  if (idents.isError) return <ErrorState error={idents.error} onRetry={() => idents.refetch()} />;
  if (idents.data.length === 0) {
    return (
      <EmptyState
        title="Aucun tracker vu"
        description="Aucune connexion ni message récent. Vérifiez la programmation serveur et la SIM des boîtiers."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {idents.data.map((i) => {
        const meta = identMeta[i.status] ?? { label: i.status, tone: "neutral" as const };
        return (
          <li key={i.ident} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 flex-col">
              {i.sisbmDeviceId ? (
                <Link
                  href={`/dashboard/device/${i.sisbmDeviceId}`}
                  prefetch={false}
                  className="truncate font-medium font-mono text-sm hover:underline"
                >
                  {i.ident}
                </Link>
              ) : (
                <span className="truncate font-medium font-mono text-sm">{i.ident}</span>
              )}
              <span className="text-muted-foreground text-xs">
                vu {formatRelative(i.lastSeenAt)} · via {i.source === "connection" ? "connexion" : "messages"}
                {i.flespiDeviceId ? ` · device ${i.flespiDeviceId}` : ""}
              </span>
            </div>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
          </li>
        );
      })}
    </ul>
  );
}

function TypesPanel({ protocolId }: { protocolId: number }) {
  const health = useFlespiHealth();
  const protocols = useProtocols(undefined, !health.isPending && health.data?.channel?.protocol_id !== protocolId);
  const protocolName =
    health.data?.channel?.protocol_id === protocolId
      ? health.data.protocolName
      : (protocols.data?.find((p) => p.id === protocolId)?.name ?? "");
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim());
  const types = useDeviceTypes(protocolName, debounced || undefined, Boolean(protocolName));

  if (!protocolName) return <LoadingRows rows={4} className="flex flex-col gap-2" />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Protocole <span className="font-medium text-foreground">{protocolName}</span> (id {protocolId})
      </p>
      <InputGroup>
        <InputGroupInput
          placeholder="Rechercher (ex. mv730)…"
          aria-label="Rechercher un type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      {types.isPending ? (
        <LoadingRows rows={5} className="flex flex-col gap-2" />
      ) : types.isError ? (
        <ErrorState error={types.error} onRetry={() => types.refetch()} />
      ) : types.data.deviceTypes.length === 0 ? (
        <EmptyState title="Aucun type trouvé" />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {types.data.deviceTypes.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{t.title}</span>
                <span className="font-mono text-muted-foreground text-xs">{t.name}</span>
              </div>
              <code className="text-muted-foreground text-xs">#{t.id}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
