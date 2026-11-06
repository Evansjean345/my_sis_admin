"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { scheduleService } from "@/services/schedule.service";
import type {
  CreateSchedulePayload,
  ScheduleListParams,
  ScheduleMode,
  ScheduleWindow,
  UpdateSchedulePayload,
} from "@/types/schedule";

import { queryKeys } from "./query-keys";

/**
 * Calendriers d'utilisation. Toute écriture invalide `schedules.all` : la
 * simulation et l'état planifié des véhicules dépendent des plages comme des
 * rattachements.
 */
function useInvalidateSchedules() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
}

export function useSchedules(params: ScheduleListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.schedules.list(params),
    queryFn: () => scheduleService.list(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useSchedule(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.schedules.detail(id ?? ""),
    queryFn: () => scheduleService.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

/** Simulation : `at` absent = maintenant. Jamais d'émission. */
export function useSchedulePreview(id: string | undefined, at: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.schedules.preview(id ?? "", at),
    queryFn: () => scheduleService.preview(id as string, at),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useVehicleScheduleStatus(vehicleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.schedules.vehicleStatus(vehicleId ?? ""),
    queryFn: () => scheduleService.vehicleStatus(vehicleId as string),
    enabled: Boolean(vehicleId),
    // Le verdict change avec l'heure : relu chaque minute, comme le moteur.
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useGroupSchedules(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.schedules.ofGroup(groupId ?? ""),
    queryFn: () => scheduleService.groupSchedules(groupId as string),
    enabled: Boolean(groupId),
    retry: false,
  });
}

export function useCreateSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => scheduleService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchedulePayload }) =>
      scheduleService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSchedule() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: (id: string) => scheduleService.remove(id),
    onSuccess: invalidate,
  });
}

export function useReplaceScheduleWindows() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, windows }: { id: string; windows: Omit<ScheduleWindow, "id">[] }) =>
      scheduleService.replaceWindows(id, windows),
    onSuccess: invalidate,
  });
}

export function useAttachScheduleVehicles() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, vehicleIds, mode }: { id: string; vehicleIds: string[]; mode: ScheduleMode }) =>
      scheduleService.attachVehicles(id, vehicleIds, mode),
    onSuccess: invalidate,
  });
}

export function useDetachScheduleVehicle() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string }) => scheduleService.detachVehicle(id, vehicleId),
    onSuccess: invalidate,
  });
}

export function useAttachScheduleGroups() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, groupIds, mode }: { id: string; groupIds: string[]; mode: ScheduleMode }) =>
      scheduleService.attachGroups(id, groupIds, mode),
    onSuccess: invalidate,
  });
}

export function useDetachScheduleGroup() {
  const invalidate = useInvalidateSchedules();
  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) => scheduleService.detachGroup(id, groupId),
    onSuccess: invalidate,
  });
}
