"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { driverService } from "@/services/driver.service";
import type { CreateDriverPayload, DriverListParams, UpdateDriverPayload } from "@/types/driver";

import { queryKeys } from "./query-keys";

/**
 * Conducteurs. Une écriture peut toucher les groupes de conducteurs (changement
 * d'organisation, ajout à un groupe) : leurs listes et effectifs sont relus.
 */
function useInvalidateDrivers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all("driver_group") });
  };
}

export function useDrivers(params: DriverListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.drivers.list(params),
    queryFn: () => driverService.list(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useDriver(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(id ?? ""),
    queryFn: () => driverService.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useVehicleDrivers(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.drivers.ofVehicle(vehicleId ?? ""),
    queryFn: () => driverService.ofVehicle(vehicleId as string),
    enabled: Boolean(vehicleId),
  });
}

export function useCreateDriver() {
  const invalidate = useInvalidateDrivers();
  return useMutation({
    mutationFn: (payload: CreateDriverPayload) => driverService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDriver() {
  const invalidate = useInvalidateDrivers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDriverPayload }) => driverService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteDriver() {
  const invalidate = useInvalidateDrivers();
  return useMutation({ mutationFn: (id: string) => driverService.remove(id), onSuccess: invalidate });
}

export function useAssignDriverVehicle() {
  const invalidate = useInvalidateDrivers();
  return useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string | null }) =>
      driverService.assignVehicle(id, vehicleId),
    onSuccess: invalidate,
  });
}

export function useAssignDriverOrganization() {
  const invalidate = useInvalidateDrivers();
  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId: string }) =>
      driverService.assignOrganization(id, organizationId),
    onSuccess: invalidate,
  });
}

export function useRemoveDriverOrganization() {
  const invalidate = useInvalidateDrivers();
  return useMutation({ mutationFn: (id: string) => driverService.removeOrganization(id), onSuccess: invalidate });
}

export function useAttachDriverGroups() {
  const invalidate = useInvalidateDrivers();
  return useMutation({
    mutationFn: ({ id, groupIds }: { id: string; groupIds: string[] }) => driverService.attachGroups(id, groupIds),
    onSuccess: invalidate,
  });
}

export function useDetachDriverGroup() {
  const invalidate = useInvalidateDrivers();
  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) => driverService.detachGroup(id, groupId),
    onSuccess: invalidate,
  });
}
