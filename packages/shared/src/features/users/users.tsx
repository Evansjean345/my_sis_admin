"use client";
import * as React from "react";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { Download, Grid, Plus, RefreshCw, Rows3, Search } from "lucide-react";

import { ErrorState } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { userStatusMeta } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { OrganizationFilter } from "@shared/features/common/organization/organization-select";
import { UserCreateDialog } from "@shared/features/users/user-create-dialog";
import { UserRowActions } from "@shared/features/users/user-row-actions";
import { getUsersColumns, UserAvatar } from "@shared/features/users/users-columns";
import { UsersTable } from "@shared/features/users/users-table";
import { useRoles, useRolesMap } from "@shared/hooks/api/use-roles";
import { useUsers } from "@shared/hooks/api/use-users";
import { dataTableFeatures } from "@shared/lib/data-table-features";
import { downloadCsv, formatDateTime } from "@shared/lib/format";
import type { User, UserStatus } from "@shared/types/user";

const ALL = "all";
const EMPTY: User[] = [];

export function Users() {
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [status, setStatus] = React.useState<UserStatus | typeof ALL>(ALL);
  const [organizationId, setOrganizationId] = React.useState<string | undefined>();
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({ search: false });
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [createOpen, setCreateOpen] = React.useState(false);

  const roles = useRoles();
  const rolesMap = useRolesMap();
  const users = useUsers({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    status: status === ALL ? undefined : status,
    organizationId,
  });

  const columns = React.useMemo(() => getUsersColumns(rolesMap), [rolesMap]);

  // Pagination côté serveur (meta de l'API), recherche et filtre de rôle côté client sur la page courante.
  const table = useTable({
    features: dataTableFeatures,
    data: users.data?.data ?? EMPTY,
    columns,
    state: { sorting, columnFilters, columnVisibility, pagination },
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: users.data?.meta.total ?? 0,
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const roleFilter = (table.getColumn("role")?.getFilterValue() as string | undefined) ?? ALL;
  const visibleUsers = table.getRowModel().rows.map((row) => row.original);

  function exportCsv() {
    downloadCsv(
      `utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`,
      visibleUsers.map((u) => ({
        organisation: u.organization?.name ?? "",
        nom: u.fullName,
        email: u.email,
        telephone: u.phone ?? "",
        role: u.role?.name ?? rolesMap.get(u.roleId)?.name ?? u.roleId,
        statut: userStatusMeta[u.status].label,
        derniere_connexion: formatDateTime(u.lastLoginAt, ""),
        cree_le: formatDateTime(u.createdAt),
      })),
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Utilisateurs</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          Tous les comptes de la plateforme, par organisation, et leurs accès.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Rechercher un utilisateur…"
              aria-label="Rechercher un utilisateur"
              value={searchQuery}
              onChange={(event) => table.getColumn("search")?.setFilterValue(event.target.value || undefined)}
            />
          </InputGroup>
          <Button variant="outline" size="sm" onClick={() => users.refetch()} disabled={users.isFetching}>
            <RefreshCw className={users.isFetching ? "animate-spin" : undefined} /> Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={visibleUsers.length === 0}>
            <Download /> Exporter
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Ajouter
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <OrganizationFilter
              value={organizationId}
              onChange={(id) => {
                setOrganizationId(id);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
            <Select
              value={roleFilter}
              onValueChange={(value) => table.getColumn("role")?.setFilterValue(value === ALL ? undefined : value)}
            >
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Rôle :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {(roles.data ?? []).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as UserStatus | typeof ALL);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Statut :</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value={ALL}>Tous</SelectItem>
                  {(Object.keys(userStatusMeta) as UserStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {userStatusMeta[s].label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-muted-foreground text-sm tabular-nums">
              {users.data ? `${users.data.meta.total} utilisateur(s)` : ""}
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "grid")}>
              <TabsList>
                <TabsTrigger value="list" aria-label="Vue liste">
                  <Rows3 />
                </TabsTrigger>
                <TabsTrigger value="grid" aria-label="Vue grille">
                  <Grid />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {users.isError ? (
          <div className="px-4">
            <ErrorState error={users.error} onRetry={() => users.refetch()} />
          </div>
        ) : users.isPending ? (
          <div className="flex flex-col gap-2 px-4">
            {Array.from({ length: 5 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : view === "list" ? (
          <UsersTable table={table} loading={users.isFetching} />
        ) : (
          <div className="grid gap-3 px-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleUsers.map((user) => {
              const meta = userStatusMeta[user.status];
              return (
                <Card key={user.id} size="sm">
                  <CardHeader>
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <CardTitle className="truncate">{user.fullName}</CardTitle>
                        <CardDescription className="truncate">{user.email}</CardDescription>
                      </div>
                    </div>
                    <CardAction>
                      <UserRowActions user={user} />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
                    <span>{rolesMap.get(user.roleId)?.name ?? "—"}</span>
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      <UserCreateDialog open={createOpen} onOpenChange={setCreateOpen} defaultOrganizationId={organizationId} />
    </Card>
  );
}
