"use client";

import { Box, Container, PlusCircle, RefreshCw, Server } from "lucide-react";

import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Skeleton } from "@shared/components/ui/skeleton";
import type { FlespiChannel, FlespiHealth } from "@shared/types/flespi";

interface ChannelsHeaderProps {
  channels: FlespiChannel[] | undefined;
  health: FlespiHealth | undefined;
  healthLoading: boolean;
  healthError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}

export function ChannelsHeader({
  channels,
  health,
  healthLoading,
  healthError,
  refreshing,
  onRefresh,
  onCreate,
}: ChannelsHeaderProps) {
  const apiOk = Boolean(health?.api.ok) && !healthError;
  const enabled = channels?.filter((c) => c.enabled).length ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-medium text-2xl leading-tight tracking-tight sm:text-3xl sm:leading-none">
            Canal de diffusion Flespi
          </h1>
          <p className="text-muted-foreground text-sm">Environnement dédié à la vérification du canal de diffusion</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw data-icon="inline-start" className={refreshing ? "animate-spin" : undefined} />
            Actualiser
          </Button>
          <Button size="sm" onClick={onCreate}>
            <PlusCircle data-icon="inline-start" />
            Nouveau canal
          </Button>
        </div>
      </div>
      {healthLoading ? (
        <Skeleton className="h-6 w-96 max-w-full" />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Container />
            {channels ? `${channels.length} canaux` : "…"}
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Box />
            {enabled} actifs
          </Badge>
          {health?.channel ? (
            <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5 font-mono">
              <Server />
              {health.channel.uri}
            </Badge>
          ) : null}
          {health ? (
            <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
              Protocole {health.protocolName} · MQTT {health.mqtt.host}:{health.mqtt.port}
            </Badge>
          ) : null}
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <span
              className={
                apiOk ? "size-2 rounded-full bg-green-600 dark:bg-green-500" : "size-2 rounded-full bg-destructive"
              }
            />
            {apiOk ? "API flespi active" : "API flespi injoignable"}
          </Badge>
        </div>
      )}
    </div>
  );
}
