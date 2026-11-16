import { api, scopedPath } from "@shared/lib/axios";
import type { AuditActions, AuditLogListParams, AuditLogPage } from "@shared/types/audit";

/**
 * Journal d'audit — lecture seule.
 *
 * Cloisonnement appliqué par l'API, pas par l'écran :
 *   exploitant plateforme : toutes les organisations, ou une seule via `organizationId`
 *   administrateur client : SON organisation, quoi qu'il demande
 * Un administrateur client qui vise une autre organisation reçoit 403 —
 * une tentative doit être visible, pas silencieuse.
 */
export const auditService = {
  /** GET /audit-logs — fenêtre par défaut : 30 jours glissants, plafond 366. */
  async list(params: AuditLogListParams = {}): Promise<AuditLogPage> {
    const { data } = await api.get<AuditLogPage>(scopedPath("/audit-logs"), { params });
    return data;
  },

  /** GET /audit-logs/actions — valeurs distinctes d'`action` sur la fenêtre. */
  async actions(params: Pick<AuditLogListParams, "from" | "to" | "organizationId"> = {}): Promise<AuditActions> {
    const { data } = await api.get<AuditActions>(scopedPath("/audit-logs/actions"), { params });
    return data;
  },
};
