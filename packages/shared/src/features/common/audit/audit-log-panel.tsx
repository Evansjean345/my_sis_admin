"use client";

import { useMemo, useState } from "react";

import { Download, RefreshCw, RotateCcw, ScrollText } from "lucide-react";

import { PaginationBar } from "@shared/components/pagination-bar";
import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import {
  AUDIT_RESOURCE_TYPES,
  auditActionLabel,
  auditActorLabel,
  auditResourceLabel,
} from "@shared/features/common/audit/audit-labels";
import { AuditLogDetailSheet } from "@shared/features/common/audit/audit-log-detail-sheet";
import { AuditLogTable } from "@shared/features/common/audit/audit-log-table";
import { useAuditActions, useAuditLogs } from "@shared/hooks/api/use-audit-logs";
import { useGroupAuditLogs } from "@shared/hooks/api/use-groups";
import { useOrganizationAuditLogs } from "@shared/hooks/api/use-organizations";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { downloadCsv, formatDateTime } from "@shared/lib/format";
import type { AuditLogEntry, AuditLogListParams, AuditResourceType } from "@shared/types/audit";
import type { GroupKind } from "@shared/types/group";

const ALL = "all";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Fenêtres proposées — bornées par le plafond de 366 jours de l'API. */
const WINDOWS = [
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "90 derniers jours" },
  { value: "365", label: "12 derniers mois" },
] as const;

/**
 * D'où viennent les lignes. Le cloisonnement est appliqué par l'API : cet
 * objet ne choisit que la route, jamais le périmètre.
 */
export type AuditSource =
  | { scope: "global" }
  | { scope: "organization"; organizationId: string }
  | { scope: "group"; kind: GroupKind; groupId: string };

interface AuditLogPanelProps {
  source: AuditSource;
  title?: string;
  description?: string;
  /** Vue inter-organisations : affiche la colonne « Organisation ». */
  showOrganization?: boolean;
  /** Journal d'une ressource précise : les filtres acteur / ressource sont superflus. */
  compact?: boolean;
  defaultPerPage?: number;
}

/**
 * Panneau de consultation du journal d'audit.
 *
 * Réutilisé par trois écrans — journal global, journal d'une organisation,
 * journal d'un groupe. Seule la source change ; les filtres, la pagination
 * et le détail sont les mêmes, et doivent le rester.
 */
export function AuditLogPanel({
  source,
  title = "Journal d'audit",
  description = "Traçabilité des actes : qui a fait quoi, quand, et sur quelle ressource.",
  showOrganization = false,
  compact = false,
  defaultPerPage = 25,
}: AuditLogPanelProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [days, setDays] = useState<string>("30");
  const [action, setAction] = useState<string>(ALL);
  const [resourceType, setResourceType] = useState<string>(ALL);
  const [actorId, setActorId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const debouncedActor = useDebouncedValue(actorId.trim());
  const debouncedResource = useDebouncedValue(resourceId.trim());

  // La borne basse est recalculée à chaque changement de fenêtre, pas à chaque
  // rendu : sinon la clé de cache changerait en continu.
  const from = useMemo(() => new Date(Date.now() - Number(days) * DAY_MS).toISOString(), [days]);

  const params: AuditLogListParams = {
    page,
    perPage,
    from,
    action: action === ALL ? undefined : action,
    resourceType: resourceType === ALL ? undefined : (resourceType as AuditResourceType),
    // Un UUID partiel ne filtrerait rien d'utile : on attend une saisie complète.
    actorId: debouncedActor.length >= 36 ? debouncedActor : undefined,
    resourceId: debouncedResource.length >= 8 ? debouncedResource : undefined,
  };

  const globalQuery = useAuditLogs(params, { enabled: source.scope === "global" });
  const organizationQuery = useOrganizationAuditLogs(
    source.scope === "organization" ? source.organizationId : undefined,
    params,
  );
  const groupQuery = useGroupAuditLogs(
    source.scope === "group" ? source.kind : "vehicle_group",
    source.scope === "group" ? source.groupId : undefined,
    params,
  );

  const query =
    source.scope === "global" ? globalQuery : source.scope === "organization" ? organizationQuery : groupQuery;

  const actions = useAuditActions({
    from,
    organizationId: source.scope === "organization" ? source.organizationId : undefined,
  });

  const entries = query.data?.data ?? [];
  const auditWindow = query.data?.meta.window;
  const filtered = action !== ALL || resourceType !== ALL || debouncedActor !== "" || debouncedResource !== "";

  function resetFilters() {
    setAction(ALL);
    setResourceType(ALL);
    setActorId("");
    setResourceId("");
    setPage(1);
  }

  function exportCsv() {
    downloadCsv(
      `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      entries.map((entry) => ({
        horodatage: formatDateTime(entry.occurredAt),
        action: entry.action,
        action_libelle: auditActionLabel(entry.action),
        ressource: auditResourceLabel(entry.resourceType),
        identifiant_ressource: entry.resourceId ?? "",
        acteur: auditActorLabel(entry),
        email_acteur: entry.actorEmail ?? "",
        adresse_ip: entry.actorIp ?? "",
        organisation: entry.organizationId ?? "",
      })),
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
          {auditWindow ? (
            <span className="mt-1 block text-xs">
              Fenêtre consultée : du {formatDateTime(auditWindow.from)} au {formatDateTime(auditWindow.to)}.
            </span>
          ) : null}
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw data-icon="inline-start" className={query.isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={entries.length === 0}>
            <Download data-icon="inline-start" />
            Exporter
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center gap-2 px-4">
          <Select
            value={days}
            onValueChange={(value) => {
              setDays(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm">
              <span className="text-muted-foreground">Période :</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                {WINDOWS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={action}
            onValueChange={(value) => {
              setAction(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="max-w-72">
              <span className="text-muted-foreground">Action :</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectGroup>
                <SelectItem value={ALL}>Toutes</SelectItem>
                {(actions.data?.data ?? []).map((value) => (
                  <SelectItem key={value} value={value}>
                    {auditActionLabel(value)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {compact ? null : (
            <>
              <Select
                value={resourceType}
                onValueChange={(value) => {
                  setResourceType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Ressource :</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    <SelectItem value={ALL}>Toutes</SelectItem>
                    {AUDIT_RESOURCE_TYPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {auditResourceLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Input
                className="h-8 w-full sm:w-64"
                placeholder="Identifiant d'acteur (UUID)"
                aria-label="Filtrer par identifiant d'acteur"
                value={actorId}
                onChange={(event) => {
                  setActorId(event.target.value);
                  setPage(1);
                }}
              />
              <Input
                className="h-8 w-full sm:w-64"
                placeholder="Identifiant de ressource"
                aria-label="Filtrer par identifiant de ressource"
                value={resourceId}
                onChange={(event) => {
                  setResourceId(event.target.value);
                  setPage(1);
                }}
              />
            </>
          )}

          {filtered ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" />
              Réinitialiser
            </Button>
          ) : null}
        </div>

        {query.isPending ? (
          <LoadingRows rows={6} />
        ) : query.isError ? (
          <div className="px-4">
            <ErrorState error={query.error} onRetry={() => query.refetch()} title="Journal indisponible" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-4">
            <EmptyState
              icon={<ScrollText />}
              title="Aucun événement"
              description={
                filtered
                  ? "Aucun événement ne correspond à ces filtres sur la période choisie."
                  : "Aucune activité tracée sur la période choisie."
              }
            />
          </div>
        ) : (
          <>
            <AuditLogTable entries={entries} onSelect={setSelected} showOrganization={showOrganization} />
            <PaginationBar
              meta={query.data?.meta}
              perPage={perPage}
              label="événements"
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          </>
        )}
      </CardContent>

      <AuditLogDetailSheet
        entry={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </Card>
  );
}
