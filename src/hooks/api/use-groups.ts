"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deviceGroupService,
  driverGroupService,
  type GroupService,
  vehicleGroupService,
} from "@/services/group.service";
import type { AuditLogListParams } from "@/types/audit";
import type { CreateGroupPayload, GroupKind, GroupListParams, UpdateGroupPayload } from "@/types/group";

import { queryKeys } from "./query-keys";

/**
 * Groupes de véhicules, de boîtiers et de conducteurs.
 *
 * Les trois familles partagent le même contrat : les hooks prennent le type
 * de groupe (`kind`) en premier argument et les clés de cache le portent.
 * Des alias nommés (`useVehicleGroups`, `useDeviceGroups`…) sont exposés en
 * fin de fichier pour que les écrans restent lisibles.
 */
const services: Record<GroupKind, GroupService> = {
  vehicle_group: vehicleGroupService,
  device_group: deviceGroupService,
  driver_group: driverGroupService,
};

export function groupServiceOf(kind: GroupKind): GroupService {
  return services[kind];
}

export function useGroups(kind: GroupKind, params: GroupListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.groups.list(kind, params),
    queryFn: () => services[kind].list(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useGroup(kind: GroupKind, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.detail(kind, id ?? ""),
    queryFn: () => services[kind].get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useGroupMembers(kind: GroupKind, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups.members(kind, id ?? ""),
    queryFn: () => services[kind].members(id as string),
    enabled: Boolean(id),
  });
}

export function useGroupAuditLogs(kind: GroupKind, id: string | undefined, params: AuditLogListParams = {}) {
  return useQuery({
    queryKey: queryKeys.audit.group(kind, id ?? "", params),
    queryFn: () => services[kind].auditLogs(id as string, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useCreateGroup(kind: GroupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => services[kind].create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(kind) }),
  });
}

export function useUpdateGroup(kind: GroupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGroupPayload }) => services[kind].update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(kind) }),
  });
}

export function useDeleteGroup(kind: GroupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => services[kind].remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(kind) }),
  });
}

/** Affectation en lot — idempotente : la réponse distingue ajoutés, inchangés et refusés. */
export function useAssignGroupMembers(kind: GroupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberIds }: { id: string; memberIds: string[] }) => services[kind].assign(id, memberIds),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(kind) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(kind, id) });
      if (kind === "driver_group") void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
      if (kind === "vehicle_group") void queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}

export function useUnassignGroupMember(kind: GroupKind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) => services[kind].unassign(id, memberId),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all(kind) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.members(kind, id) });
      if (kind === "driver_group") void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
      if (kind === "vehicle_group") void queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Alias nommés — même implémentation, lecture plus directe dans les écrans.
// ---------------------------------------------------------------------------

export const useVehicleGroups = (params: GroupListParams = {}, options: { enabled?: boolean } = {}) =>
  useGroups("vehicle_group", params, options);
export const useVehicleGroup = (id: string | undefined) => useGroup("vehicle_group", id);
export const useDeviceGroups = (params: GroupListParams = {}) => useGroups("device_group", params);
export const useDeviceGroup = (id: string | undefined) => useGroup("device_group", id);
export const useDriverGroups = (params: GroupListParams = {}, options: { enabled?: boolean } = {}) =>
  useGroups("driver_group", params, options);
export const useDriverGroup = (id: string | undefined) => useGroup("driver_group", id);
