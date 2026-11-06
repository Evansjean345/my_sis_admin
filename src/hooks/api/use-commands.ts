"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { commandService, securityService } from "@/services/command.service";
import type { BusinessCommandSlug, CommandParams, RawCommandPayload, SecurityCommandPayload } from "@/types/command";

import { queryKeys } from "./query-keys";

export function useCommandHistory(deviceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.commands.history(deviceId ?? ""),
    queryFn: () => commandService.history(deviceId as string),
    enabled: Boolean(deviceId) && enabled,
  });
}

export function useCommandCatalog(deviceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.commands.catalog(deviceId ?? ""),
    queryFn: () => commandService.catalog(deviceId as string),
    enabled: Boolean(deviceId),
    staleTime: 30 * 60_000,
  });
}

export function useFlespiCommandCatalog(deviceId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.commands.flespiCatalog(deviceId ?? ""),
    queryFn: () => commandService.flespiCatalog(deviceId as string),
    enabled: Boolean(deviceId) && enabled,
    staleTime: 30 * 60_000,
    retry: false,
  });
}

/** Après toute commande : historique, diagnostic, télémétrie et véhicules sont à relire. */
function useInvalidateAfterCommand() {
  const queryClient = useQueryClient();
  return (deviceId: string) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.commands.all(deviceId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.devices.diagnostic(deviceId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.devices.telemetry(deviceId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
  };
}

/** Synchronisation manuelle (bouton « Synchroniser »). */
export function useSyncCommands() {
  const invalidate = useInvalidateAfterCommand();
  return useMutation({
    mutationFn: (deviceId: string) => commandService.sync(deviceId),
    onSettled: (_data, _error, deviceId) => invalidate(deviceId),
  });
}

/** Commande métier (arm, reboot, request-status…) — la synchro est faite par le service. */
export function useRunCommand() {
  const invalidate = useInvalidateAfterCommand();
  return useMutation({
    mutationFn: ({ deviceId, slug, params }: { deviceId: string; slug: BusinessCommandSlug; params: CommandParams }) =>
      commandService.run(deviceId, slug, params),
    onSettled: (_data, _error, { deviceId }) => invalidate(deviceId),
  });
}

/** Commande flespi brute — la synchro est faite par le service. */
export function useSendRawCommand() {
  const invalidate = useInvalidateAfterCommand();
  return useMutation({
    mutationFn: ({ deviceId, payload }: { deviceId: string; payload: RawCommandPayload }) =>
      commandService.send(deviceId, payload),
    onSettled: (_data, _error, { deviceId }) => invalidate(deviceId),
  });
}

export function useCancelCommand() {
  const invalidate = useInvalidateAfterCommand();
  return useMutation({
    mutationFn: ({ deviceId, commandId }: { deviceId: string; commandId: string }) =>
      commandService.cancel(deviceId, commandId),
    onSettled: (_data, _error, { deviceId }) => invalidate(deviceId),
  });
}

/** Immobilisation (coupure carburant) — `deviceId` sert à la synchronisation. */
export function useImmobilizeVehicle() {
  const invalidate = useInvalidateAfterCommand();
  return useMutation({
    mutationFn: ({ deviceId, payload }: { deviceId: string; payload: SecurityCommandPayload }) =>
      securityService.immobilize(deviceId, payload),
    onSettled: (_data, _error, { deviceId }) => invalidate(deviceId),
  });
}

/** Rétablissement (carburant / alimentation) — `deviceId` sert à la synchronisation. */
export function useRestoreVehicle() {
  const invalidate = useInvalidateAfterCommand();
  return useMutation({
    mutationFn: ({ deviceId, payload }: { deviceId: string; payload: SecurityCommandPayload }) =>
      securityService.restore(deviceId, payload),
    onSettled: (_data, _error, { deviceId }) => invalidate(deviceId),
  });
}

/**
 * Coupure / rétablissement IMMÉDIAT de toute une flotte. Les commandes
 * touchent plusieurs boîtiers : on relit tout l'historique des commandes,
 * les véhicules et l'état planifié.
 */
function useGroupCommand(
  send: (groupId: string, reason: string) => ReturnType<typeof securityService.immobilizeGroup>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, reason }: { groupId: string; reason: string }) => send(groupId, reason),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["commands"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}

export function useImmobilizeGroup() {
  return useGroupCommand((groupId, reason) => securityService.immobilizeGroup(groupId, reason));
}

export function useRestoreGroup() {
  return useGroupCommand((groupId, reason) => securityService.restoreGroup(groupId, reason));
}
