"use client";

import { useMemo, useState } from "react";

import { Plus, Users } from "lucide-react";

import { PaginationBar } from "@shared/components/pagination-bar";
import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { userStatusMeta } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { OrganizationUserDialog } from "@shared/features/entreprises/detail/organization-user-dialog";
import { useOrganizationRoles, useOrganizationUsers } from "@shared/hooks/api/use-organizations";
import { formatDateTime } from "@shared/lib/format";

/** Comptes rattachés à l'organisation, avec création d'un nouveau compte. */
export function OrganizationUsersCard({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);

  const users = useOrganizationUsers(organizationId, { page, perPage });
  const roles = useOrganizationRoles(organizationId);
  const rolesById = useMemo(() => new Map((roles.data ?? []).map((role) => [role.id, role])), [roles.data]);

  const rows = users.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle>Comptes</CardTitle>
        <CardDescription>Utilisateurs pouvant se connecter au nom de cette organisation.</CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Ajouter un compte
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        {users.isPending ? (
          <LoadingRows rows={4} />
        ) : users.isError ? (
          <div className="px-4">
            <ErrorState error={users.error} onRetry={() => users.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4">
            <EmptyState
              icon={<Users />}
              title="Aucun compte"
              description="Personne ne peut encore se connecter pour cette organisation."
              action={
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Ajouter un compte
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="hidden md:table-cell">Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden xl:table-cell">Dernière connexion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => {
                    const meta = userStatusMeta[user.status] ?? { label: user.status, tone: "neutral" as const };
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.fullName}</span>
                            <span className="text-muted-foreground text-xs">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {rolesById.get(user.roleId)?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {formatDateTime(user.lastLoginAt, "jamais")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <PaginationBar
              meta={users.data?.meta}
              perPage={perPage}
              label="comptes"
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          </>
        )}
      </CardContent>

      <OrganizationUserDialog
        organizationId={organizationId}
        organizationName={organizationName}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </Card>
  );
}
