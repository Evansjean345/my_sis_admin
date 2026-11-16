"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { auditService } from "@shared/services/audit.service";
import type { AuditLogListParams } from "@shared/types/audit";

/**
 * Journal d'audit — lecture seule, aucune mutation n'existe.
 *
 * `retry: false` : les échecs attendus ici sont des refus d'habilitation
 * (403 sans `audit:read`) ou des fenêtres invalides (422). Les rejouer ne
 * ferait que répéter le même refus.
 */
export function useAuditLogs(params: AuditLogListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => auditService.list(params),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

/** Valeurs distinctes d'`action` sur la fenêtre — alimente le filtre du tableau de bord. */
export function useAuditActions(params: Pick<AuditLogListParams, "from" | "to" | "organizationId"> = {}) {
  return useQuery({
    queryKey: queryKeys.audit.actions(params),
    queryFn: () => auditService.actions(params),
    staleTime: 5 * 60_000,
    retry: false,
  });
}
