"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { flespiService } from "@shared/services/flespi.service";
import type { CreateChannelPayload, UpdateChannelPayload } from "@shared/types/flespi";

export function useFlespiHealth() {
  return useQuery({
    queryKey: queryKeys.flespi.health,
    queryFn: flespiService.health,
    retry: false,
  });
}

export function useChannels() {
  return useQuery({
    queryKey: queryKeys.flespi.channels,
    queryFn: flespiService.listChannels,
  });
}

export function useChannelConnections(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.flespi.connections(id),
    queryFn: () => flespiService.channelConnections(id),
    enabled,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useChannelLogs(id: number, count = 50, enabled = true) {
  return useQuery({
    queryKey: queryKeys.flespi.logs(id, count),
    queryFn: () => flespiService.channelLogs(id, { count }),
    enabled,
    retry: false,
  });
}

export function useChannelIdents(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.flespi.idents(id),
    queryFn: () => flespiService.channelIdents(id),
    enabled,
    retry: false,
  });
}

export function useDeviceTypes(protocol: string, search?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.flespi.deviceTypes(protocol, search),
    queryFn: () => flespiService.deviceTypes(protocol, search),
    enabled: enabled && Boolean(protocol),
    staleTime: 60 * 60_000,
    retry: false,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => flespiService.createChannel(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.flespi.all }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateChannelPayload }) =>
      flespiService.updateChannel(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.flespi.all }),
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => flespiService.deleteChannel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.flespi.all }),
  });
}

export function useProtocols(search?: string, enabled = true) {
  return useQuery({
    queryKey: ["flespi", "protocols", search ?? ""] as const,
    queryFn: () => flespiService.protocols(search),
    enabled,
    staleTime: 60 * 60_000,
    retry: false,
  });
}
