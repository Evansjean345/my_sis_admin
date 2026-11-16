"use client";

import { permissionLabel } from "@shared/components/status-labels";
import { Badge } from "@shared/components/ui/badge";
import { Separator } from "@shared/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@shared/components/ui/sheet";
import type { RoleRow } from "@shared/features/roles/roles-table/data";

export function RoleSheet({ role, onOpenChange }: { role: RoleRow | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={Boolean(role)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {role ? (
          <>
            <SheetHeader>
              <SheetTitle>{role.name}</SheetTitle>
              <SheetDescription>{role.description ?? "Aucune description."}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-sm font-mono">
                  {role.code}
                </Badge>
                <Badge variant="outline" className="rounded-sm">
                  {role.is_system ? "Rôle système" : "Rôle personnalisé"}
                </Badge>
                {role.usersCount !== null ? (
                  <Badge variant="outline" className="rounded-sm">
                    {role.usersCount} utilisateur(s)
                  </Badge>
                ) : null}
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-sm">Permissions ({role.permissions.length})</h3>
                <ul className="flex flex-col divide-y rounded-lg border">
                  {role.permissions.map((permission) => (
                    <li key={permission} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span>{permissionLabel(permission)}</span>
                      <code className="text-muted-foreground text-xs">{permission}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
