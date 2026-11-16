"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { vehicleService } from "@shared/services/vehicle.service";
import type { CreateVehiclePayload, UpdateVehiclePayload, VehicleListParams } from "@shared/types/vehicle";

export function useVehicles(params: VehicleListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.vehicles.list(params),
    queryFn: () => vehicleService.list(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id ?? ""),
    queryFn: () => vehicleService.get(id as string),
    enabled: Boolean(id),
    // La dernière position vieillit vite : rafraîchissement toutes les 30 s.
    refetchInterval: 30_000,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) => vehicleService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehiclePayload }) => vehicleService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehicleService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}
