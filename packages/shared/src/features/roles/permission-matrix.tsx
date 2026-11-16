import { cn } from "cn";
import { Check, Eye, Minus } from "lucide-react";

import { PERMISSION_ACTION_LABELS, PERMISSION_LABELS } from "@shared/components/status-labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip";
import { accessLevel, PERMISSION_RESOURCES } from "@shared/features/roles/roles-table/data";
import type { Role } from "@shared/types/role";

function Cell({ role, resource }: { role: Role; resource: string }) {
  const { level, actions } = accessLevel(role.permissions, resource);
  const label =
    level === "full"
      ? "Accès complet"
      : level === "none"
        ? "Aucun accès"
        : actions.map((a) => PERMISSION_ACTION_LABELS[a] ?? a).join(", ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md",
            level === "full" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            level === "partial" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            level === "read" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
            level === "none" && "text-muted-foreground/60",
          )}
          role="img"
          aria-label={label}
        >
          {level === "full" ? (
            <Check className="size-4" />
          ) : level === "read" ? (
            <Eye className="size-4" />
          ) : level === "partial" ? (
            <span className="font-medium text-xs">{actions.length}</span>
          ) : (
            <Minus className="size-4" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function PermissionMatrix({ roles }: { roles: Role[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-background">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="h-10 px-4 font-medium text-foreground">Rôle</TableHead>
            {PERMISSION_RESOURCES.map((resource) => (
              <TableHead key={resource} className="h-10 px-2 text-center font-medium text-foreground">
                {PERMISSION_LABELS[resource] ?? resource}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} className="h-12 hover:bg-muted/20">
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{role.name}</span>
                  <span className="font-mono text-muted-foreground text-xs">{role.code}</span>
                </div>
              </TableCell>
              {PERMISSION_RESOURCES.map((resource) => (
                <TableCell key={resource} className="px-2 text-center">
                  <Cell role={role} resource={resource} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center gap-4 border-t px-4 py-3 text-muted-foreground text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5 text-emerald-600" /> Accès complet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-3.5 text-sky-600" /> Lecture seule
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-medium text-amber-600">n</span> Actions partielles
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="size-3.5" /> Aucun accès
        </span>
      </div>
    </div>
  );
}
