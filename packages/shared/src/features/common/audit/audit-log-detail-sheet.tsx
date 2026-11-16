"use client";

import { DetailList } from "@shared/components/detail-list";
import { StatusBadge } from "@shared/components/status-badge";
import { ScrollArea } from "@shared/components/ui/scroll-area";
import { Separator } from "@shared/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@shared/components/ui/sheet";
import {
  auditActionLabel,
  auditActionTone,
  auditActorLabel,
  auditResourceLabel,
} from "@shared/features/common/audit/audit-labels";
import { formatDateTime } from "@shared/lib/format";
import type { AuditLogEntry } from "@shared/types/audit";

function JsonBlock({ title, value }: { title: string; value: Record<string, unknown> | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="font-medium text-sm">{title}</h3>
      {value && Object.keys(value).length > 0 ? (
        <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : (
        <p className="text-muted-foreground text-sm">Aucune donnée.</p>
      )}
    </div>
  );
}

/**
 * Détail d'une ligne d'audit.
 *
 * `before` / `after` sont des clichés JSON libres : leur forme dépend de
 * l'action tracée. On les rend tels quels plutôt que d'inventer un affichage
 * par type — c'est la pièce d'audit, elle doit rester fidèle.
 */
export function AuditLogDetailSheet({
  entry,
  open,
  onOpenChange,
}: {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        {entry ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                <span>Événement #{entry.id}</span>
                <StatusBadge tone={auditActionTone(entry.action)}>{auditActionLabel(entry.action)}</StatusBadge>
              </SheetTitle>
              <SheetDescription>{formatDateTime(entry.occurredAt)}</SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-5 px-4 pb-6">
                <DetailList
                  className="sm:grid-cols-2 xl:grid-cols-2"
                  items={[
                    { label: "Action", value: entry.action, mono: true },
                    { label: "Acteur", value: auditActorLabel(entry) },
                    { label: "E-mail de l'acteur", value: entry.actorEmail ?? "—" },
                    { label: "Type d'acteur", value: entry.actorType },
                    { label: "Adresse IP", value: entry.actorIp ?? "—", mono: Boolean(entry.actorIp) },
                    { label: "Ressource", value: auditResourceLabel(entry.resourceType) },
                    { label: "Identifiant de ressource", value: entry.resourceId ?? "—", mono: true },
                    { label: "Organisation", value: entry.organizationId ?? "—", mono: true },
                    { label: "Identifiant d'acteur", value: entry.actorId ?? "—", mono: true },
                    { label: "Survenu le", value: formatDateTime(entry.occurredAt) },
                  ]}
                />

                <Separator />

                <JsonBlock title="Avant" value={entry.before} />
                <JsonBlock title="Après" value={entry.after} />
                <JsonBlock title="Métadonnées" value={entry.metadata} />
              </div>
            </ScrollArea>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
