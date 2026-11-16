"use client";

import { StatusBadge } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import {
  auditActionLabel,
  auditActionTone,
  auditActorLabel,
  auditResourceLabel,
} from "@shared/features/common/audit/audit-labels";
import { formatDateTime } from "@shared/lib/format";
import type { AuditLogEntry } from "@shared/types/audit";

/** Table du journal — purement présentationnelle : le panneau tient l'état. */
export function AuditLogTable({
  entries,
  onSelect,
  showOrganization = false,
}: {
  entries: AuditLogEntry[];
  onSelect: (entry: AuditLogEntry) => void;
  /** Vue inter-organisations (exploitant plateforme) : la colonne devient utile. */
  showOrganization?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Horodatage</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="hidden lg:table-cell">Ressource</TableHead>
            <TableHead className="hidden md:table-cell">Acteur</TableHead>
            {showOrganization ? <TableHead className="hidden xl:table-cell">Organisation</TableHead> : null}
            <TableHead className="hidden xl:table-cell">Adresse IP</TableHead>
            <TableHead className="w-24 text-right">
              <span className="sr-only">Détail</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="cursor-pointer" onClick={() => onSelect(entry)}>
              <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDateTime(entry.occurredAt)}
              </TableCell>
              <TableCell>
                <StatusBadge tone={auditActionTone(entry.action)}>{auditActionLabel(entry.action)}</StatusBadge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-col">
                  <span>{auditResourceLabel(entry.resourceType)}</span>
                  {entry.resourceId ? (
                    <span className="truncate font-mono text-muted-foreground text-xs">{entry.resourceId}</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col">
                  <span>{auditActorLabel(entry)}</span>
                  {entry.actorEmail ? (
                    <span className="truncate text-muted-foreground text-xs">{entry.actorEmail}</span>
                  ) : null}
                </div>
              </TableCell>
              {showOrganization ? (
                <TableCell className="hidden truncate font-mono text-muted-foreground text-xs xl:table-cell">
                  {entry.organizationId ?? "—"}
                </TableCell>
              ) : null}
              <TableCell className="hidden font-mono text-muted-foreground text-xs xl:table-cell">
                {entry.actorIp ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(entry);
                  }}
                >
                  Détail
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
