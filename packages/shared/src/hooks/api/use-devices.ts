"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { deviceService } from "@shared/services/device.service";
import type {
  AssignDevicePayload,
  CreateDevicePayload,
  DeviceListParams,
  SyncDeviceFlespiPayload,
  UpdateDevicePayload,
} from "@shared/types/device";

export function useDevices(params: DeviceListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.devices.list(params),
    queryFn: () => deviceService.list(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useDevice(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.devices.detail(id ?? ""),
    queryFn: () => deviceService.get(id as string),
    enabled: Boolean(id),
  });
}

/** Diagnostic flespi. Désactivé tant que le boîtier n'est pas rattaché (sinon 409). */
export function useDeviceDiagnostic(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.devices.diagnostic(id ?? ""),
    queryFn: () => deviceService.diagnostic(id as string),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useDeviceTelemetry(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.devices.telemetry(id ?? ""),
    queryFn: () => deviceService.telemetry(id as string),
    enabled: Boolean(id) && enabled,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useDeviceLogs(id: string | undefined, count = 50, enabled = true) {
  return useQuery({
    queryKey: queryKeys.devices.logs(id ?? "", count),
    queryFn: () => deviceService.logs(id as string, { count }),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevicePayload) => deviceService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDevicePayload }) => deviceService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deviceService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useSyncDeviceFlespi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SyncDeviceFlespiPayload }) =>
      deviceService.syncFlespi(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all }),
  });
}

export function useAssignDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignDevicePayload }) => deviceService.assign(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}

export function useUnassignDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deviceService.unassign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.devices.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
    },
  });
}
