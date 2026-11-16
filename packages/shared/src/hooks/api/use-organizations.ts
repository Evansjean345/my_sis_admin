"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { queryKeys } from "@shared/hooks/api/query-keys";
import { useRoles } from "@shared/hooks/api/use-roles";
import { organizationService } from "@shared/services/organization.service";
import type { AuditLogListParams } from "@shared/types/audit";
import type {
  CreateOrganizationPayload,
  CreateOrganizationUserPayload,
  OrganizationListParams,
  UpdateOrganizationPayload,
} from "@shared/types/organization";
import type { UserListParams } from "@shared/types/user";

export function useOrganizations(params: OrganizationListParams = {}) {
  return useQuery({
    queryKey: queryKeys.organizations.list(params),
    queryFn: () => organizationService.list(params),
    placeholderData: keepPreviousData,
    // Un 403 signifie « pas exploitant plateforme » : réessayer n'y changera rien.
    retry: false,
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.organizations.detail(id ?? ""),
    queryFn: () => organizationService.get(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

/**
 * Nom et code d'une organisation référencée par une autre ressource.
 * Utilise le résumé embarqué par l'API quand il existe ; sinon lit la fiche
 * (requête partagée et mise en cache par React Query).
 */
export function useOrganizationLabel(
  id: string | null | undefined,
  embedded?: { name: string; code: string } | null,
): { name: string; code: string } | null {
  const organization = useOrganization(embedded ? undefined : (id ?? undefined));
  const source = embedded ?? organization.data;
  return source ? { name: source.name, code: source.code } : null;
}

/** Rôles proposables dans l'organisation — `assignable` reflète la non-escalade. */
/**
 * Rôles proposés dans les formulaires de compte, selon le périmètre :
 *  - plateforme : rôles de l'organisation CIBLE (`/admin/organizations/:id/roles`) ;
 *  - organisation : `/roles`, rôles système + propres à son organisation.
 * Dans les deux cas, `assignable` vient de l'API (non-escalade) : un
 * administrateur voit `super_admin` grisé.
 */
export function useAssignableRoles(organizationId: string | undefined, enabled = true) {
  const platform = useOptionalAccess()?.isPlatform ?? true;
  const forOrganization = useOrganizationRoles(enabled && platform ? organizationId : undefined);
  const own = useRoles(enabled && !platform);
  const data = platform
    ? forOrganization.data
    : own.data?.map((r) => ({ id: r.id, name: r.name, assignable: r.assignable }));
  return { data, isPending: platform ? forOrganization.isPending : own.isPending };
}

export function useOrganizationRoles(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.organizations.roles(id ?? ""),
    queryFn: () => organizationService.roles(id as string),
    enabled: Boolean(id),
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useOrganizationUsers(id: string | undefined, params: UserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.organizations.users(id ?? "", params),
    queryFn: () => organizationService.users(id as string, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useOrganizationAuditLogs(id: string | undefined, params: AuditLogListParams = {}) {
  return useQuery({
    queryKey: queryKeys.audit.organization(id ?? "", params),
    queryFn: () => organizationService.auditLogs(id as string, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) => organizationService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOrganizationPayload }) =>
      organizationService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
  });
}

export function useCreateOrganizationUser(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrganizationUserPayload) =>
      organizationService.createUser(organizationId as string, payload),
    onSuccess: () => {
      // Le compteur `stats.users` du détail bouge aussi : on invalide la branche entière.
      void queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
