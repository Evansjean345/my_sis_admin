"use client";

import { useState } from "react";

import { Server } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { ChannelCard } from "@shared/features/channel/channel-card";
import { ChannelCreateDialog } from "@shared/features/channel/channel-create-dialog";
import { ChannelsHeader } from "@shared/features/channel/channels-header";
import { useChannels, useFlespiHealth } from "@shared/hooks/api/use-flespi";

export function Channels() {
  const channels = useChannels();
  const health = useFlespiHealth();
  const [createOpen, setCreateOpen] = useState(false);
  const productionId = health.data?.configuredChannelId ?? null;

  // Canal de production en premier.
  const sorted = [...(channels.data ?? [])].sort(
    (a, b) => Number(b.id === productionId) - Number(a.id === productionId) || a.name.localeCompare(b.name),
  );

  return (
    <div className="flex flex-col gap-4">
      <ChannelsHeader
        channels={channels.data}
        health={health.data}
        healthLoading={health.isPending}
        healthError={health.isError}
        refreshing={channels.isFetching || health.isFetching}
        onRefresh={() => {
          channels.refetch();
          health.refetch();
        }}
        onCreate={() => setCreateOpen(true)}
      />

      <div className="flex flex-col gap-4">
        {channels.isPending ? (
          <LoadingRows rows={3} className="flex flex-col gap-4" />
        ) : channels.isError ? (
          <ErrorState error={channels.error} onRetry={() => channels.refetch()} />
        ) : sorted.length === 0 ? (
          <EmptyState icon={<Server />} title="Aucun canal" description="Créez un canal pour recevoir les trames." />
        ) : (
          sorted.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} isProduction={channel.id === productionId} />
          ))
        )}
      </div>

      <ChannelCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
