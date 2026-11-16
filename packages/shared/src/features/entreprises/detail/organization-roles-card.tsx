"use client";

import { Lock } from "lucide-react";

import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { permissionLabel } from "@shared/components/status-labels";
import { Badge } from "@shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { useOrganizationRoles } from "@shared/hooks/api/use-organizations";

/**
 * Rôles utilisables dans l'organisation.
 *
 * `assignable` vient de l'API : c'est la même règle de non-escalade que
 * celle appliquée à l'écriture. Un rôle non attribuable est affiché, mais
 * signalé — sinon son absence du formulaire paraîtrait arbitraire.
 */
export function OrganizationRolesCard({ organizationId }: { organizationId: string }) {
  const roles = useOrganizationRoles(organizationId);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Rôles disponibles</CardTitle>
        <CardDescription>Rôles système et rôles propres à cette organisation.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {roles.isPending ? (
          <LoadingRows rows={3} className="flex flex-col gap-2" />
        ) : roles.isError ? (
          <ErrorState error={roles.error} onRetry={() => roles.refetch()} />
        ) : (roles.data ?? []).length === 0 ? (
          <EmptyState icon={<Lock />} title="Aucun rôle" description="Aucun rôle n'est défini pour ce périmètre." />
        ) : (
          (roles.data ?? []).map((role) => (
            <div key={role.id} className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-sm">{role.name}</span>
                <span className="font-mono text-muted-foreground text-xs">{role.code}</span>
                {role.isSystem ? (
                  <StatusBadge tone="neutral" dot={false}>
                    Système
                  </StatusBadge>
                ) : null}
                {role.assignable ? (
                  <StatusBadge tone="success" dot={false}>
                    Attribuable
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="warning" dot={false}>
                    Hors de vos droits
                  </StatusBadge>
                )}
              </div>
              {role.description ? <p className="text-muted-foreground text-sm">{role.description}</p> : null}
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((permission) => (
                  <Badge key={permission} variant="outline" className="rounded-sm font-normal text-xs">
                    {permissionLabel(permission)}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
