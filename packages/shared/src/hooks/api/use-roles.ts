"use client";

import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { roleService } from "@shared/services/role.service";
import type { Role } from "@shared/types/role";

/** GET /roles — exige `user:write` : `enabled = false` pour un opérateur. */
export function useRoles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: roleService.list,
    staleTime: 10 * 60_000,
    enabled,
    retry: false,
  });
}

/** Dictionnaire roleId → rôle, pratique pour afficher le nom d'un rôle dans une table. */
export function useRolesMap(): Map<string, Role> {
  const { data } = useRoles();
  return useMemo(() => new Map((data ?? []).map((role) => [role.id, role])), [data]);
}
